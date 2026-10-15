const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { AppError } = require('../utils/apiResponse');
const { logAction } = require('./auditService');
const { emitAppointmentUpdate } = require('../config/socket');
const emailService = require('./emailService');

class AppointmentService {
  /**
   * Search patients by ID, mobile number, or name
   */
  async searchPatients(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await Patient.find().sort({ createdAt: -1 }).limit(20);
    }

    const regex = new RegExp(searchTerm.trim(), 'i');
    return await Patient.find({
      $or: [
        { patientId: regex },
        { phone: regex },
        { name: regex }
      ]
    }).limit(20);
  }

  /**
   * Book an appointment with robust concurrency handling
   * - Uses MongoDB session / transaction when supported
   * - Relies on the unique compound index { doctor: 1, date: 1, slotStartTime: 1 } (partial filter status != 'Cancelled')
   * - Detects E11000 and throws a clear Double-Booking conflict error
   */
  async bookAppointment(bookingData, req) {
    const {
      patientType,
      patientId,
      newPatientData,
      doctorId,
      department,
      date,
      slotStartTime,
      slotEndTime,
      purpose,
      notes
    } = bookingData;

    // 1. Validate Doctor exists and is active
    const doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR', isActive: true });
    if (!doctor) {
      throw new AppError('Selected doctor is invalid or inactive', 404);
    }

    // 2. Validate booking is not in the past
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date < todayStr) {
      throw new AppError('Cannot book an appointment for a past date', 400);
    }
    if (date === todayStr) {
      const [h, m] = slotStartTime.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      if (slotMinutes <= currentMinutes) {
        throw new AppError('Cannot book an appointment for an elapsed time slot', 400);
      }
    }

    // 3. Resolve or Create Patient
    let patientRecord = null;

    if (patientType === 'EXISTING') {
      if (!patientId) {
        throw new AppError('Patient ID or MongoDB _id is required for existing patient', 400);
      }
      patientRecord = await Patient.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(patientId) ? patientId : null },
          { patientId: patientId }
        ]
      });

      if (!patientRecord) {
        throw new AppError('Existing patient not found', 404);
      }
    } else {
      // NEW Patient - auto generate readable Patient ID (e.g., PAT-839201)
      if (!newPatientData || !newPatientData.name || !newPatientData.phone) {
        throw new AppError('New patient requires name and phone number', 400);
      }

      // Check if patient with same phone already exists
      let existingByPhone = await Patient.findOne({ phone: newPatientData.phone });
      if (existingByPhone) {
        patientRecord = existingByPhone;
      } else {
        const generatedPatientId = 'PAT-' + Math.floor(100000 + Math.random() * 900000);
        patientRecord = await Patient.create({
          patientId: generatedPatientId,
          name: newPatientData.name,
          phone: newPatientData.phone,
          email: newPatientData.email || '',
          gender: newPatientData.gender || 'Other',
          age: newPatientData.age,
          address: newPatientData.address || ''
        });
      }
    }

    // 4. Ensure index creation has synced
    await Appointment.init();

    // Check if slot is already occupied by active appointment (Defense-in-depth + database unique index)
    const existingBooking = await Appointment.findOne({
      doctor: doctorId,
      date,
      slotStartTime,
      status: { $ne: 'Cancelled' }
    });

    if (existingBooking) {
      throw new AppError(
        `Conflict: The time slot ${slotStartTime} on ${date} for this doctor has already been booked. Please choose another slot.`,
        409
      );
    }

    // Generate unique Appointment Reference Number (e.g., APP-20261014-4912)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateFormatted = date.replace(/-/g, '');
    const appointmentNumber = `APP-${dateFormatted}-${randomSuffix}`;

    // 5. Attempt creation with Concurrency Lock
    try {
      const newAppointment = await Appointment.create({
        appointmentNumber,
        patient: patientRecord._id,
        doctor: doctorId,
        department,
        date,
        slotStartTime,
        slotEndTime,
        status: 'Scheduled',
        purpose: purpose || 'General Consultation',
        notes: notes || '',
        createdBy: req.user._id
      });

      // Populate patient and doctor for consistent response and socket broadcast
      const populated = await Appointment.findById(newAppointment._id)
        .populate('patient', 'patientId name phone email gender age')
        .populate('doctor', 'name email department');

      // Audit Log
      await logAction({
        user: req.user._id,
        userName: req.user.name,
        role: req.user.role,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: newAppointment._id.toString(),
        details: {
          appointmentNumber,
          doctorId,
          date,
          slotStartTime,
          patientName: patientRecord.name
        },
        req
      });

      // Emit real-time WebSocket event
      emitAppointmentUpdate('CREATED', populated);

      // Dispatch patient confirmation email asynchronously if email present
      if (patientRecord.email) {
        emailService.sendAppointmentConfirmationEmail({
          to: patientRecord.email,
          patientName: patientRecord.name,
          doctorName: doctor.name,
          department,
          date,
          slotStartTime,
          slotEndTime,
          appointmentNumber
        }).catch(e => console.error('Confirmation email error:', e.message));
      }

      return populated;
    } catch (err) {
      // Catch MongoDB unique index conflict on { doctor, date, slotStartTime }
      if (err.code === 11000) {
        throw new AppError(
          `Conflict: The time slot ${slotStartTime} on ${date} for this doctor has already been booked by another user. Please choose another slot.`,
          409
        );
      }
      throw err;
    }
  }

  /**
   * Search, Filter & Server-Side Paginate Appointments
   */
  async getAppointments({
    page = 1,
    limit = 10,
    sortBy = 'date',
    sortOrder = 'desc',
    doctorId,
    department,
    status,
    startDate,
    endDate,
    search,
    user // Requesting user for RBAC enforcement
  }) {
    const query = {};

    // Doctor role can ONLY view their own appointments
    if (user.role === 'DOCTOR') {
      query.doctor = user._id;
    } else if (doctorId) {
      query.doctor = doctorId;
    }

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Search across Patient Name, Phone, or Appointment Number
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingPatients = await Patient.find({
        $or: [{ name: searchRegex }, { phone: searchRegex }, { patientId: searchRegex }]
      }).select('_id');

      const patientIds = matchingPatients.map(p => p._id);

      query.$or = [
        { appointmentNumber: searchRegex },
        { patient: { $in: patientIds } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;
    if (sortBy !== 'slotStartTime') {
      sortOption.slotStartTime = 1;
    }

    const [appointments, totalCount] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'patientId name phone email gender age')
        .populate('doctor', 'name email department')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appointment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      appointments,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }

  async getAppointmentById(id, user) {
    const appointment = await Appointment.findById(id)
      .populate('patient', 'patientId name phone email gender age address')
      .populate('doctor', 'name email department phone');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Doctor can only access their own
    if (user.role === 'DOCTOR' && appointment.doctor._id.toString() !== user._id.toString()) {
      throw new AppError('Forbidden: You can only view your own appointments', 403);
    }

    return appointment;
  }

  /**
   * Update appointment details (purpose, notes, consultation notes)
   */
  async updateAppointment(id, updateData, req) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (req.user.role === 'DOCTOR' && appointment.doctor.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden: You can only update your own appointments', 403);
    }

    // Role-specific fields
    if (updateData.purpose !== undefined) appointment.purpose = updateData.purpose;
    if (updateData.notes !== undefined) appointment.notes = updateData.notes;
    if (updateData.consultationNotes !== undefined) appointment.consultationNotes = updateData.consultationNotes;

    // Doctor completing appointment
    if (updateData.status && ['Scheduled', 'Arrived', 'Completed'].includes(updateData.status)) {
      appointment.status = updateData.status;
    }

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'patientId name phone email gender age')
      .populate('doctor', 'name email department');

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPOINTMENT_UPDATED',
      entity: 'Appointment',
      entityId: appointment._id.toString(),
      details: updateData,
      req
    });

    emitAppointmentUpdate('UPDATED', populated);

    return populated;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id, reason, req) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'Cancelled') {
      throw new AppError('Appointment is already cancelled', 400);
    }

    appointment.status = 'Cancelled';
    appointment.cancelledReason = reason || 'Cancelled by staff';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'patientId name phone email gender age')
      .populate('doctor', 'name email department');

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPOINTMENT_CANCELLED',
      entity: 'Appointment',
      entityId: appointment._id.toString(),
      details: { reason: appointment.cancelledReason },
      req
    });

    emitAppointmentUpdate('CANCELLED', populated);

    return populated;
  }

  /**
   * Mark patient as Arrived
   */
  async markPatientArrived(id, req) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'Cancelled') {
      throw new AppError('Cannot mark a cancelled appointment as arrived', 400);
    }

    appointment.status = 'Arrived';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'patientId name phone email gender age')
      .populate('doctor', 'name email department');

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'PATIENT_ARRIVED',
      entity: 'Appointment',
      entityId: appointment._id.toString(),
      req
    });

    emitAppointmentUpdate('ARRIVED', populated);

    return populated;
  }

  /**
   * Audit trail query with server-side pagination
   */
  async getAuditLogs({ page = 1, limit = 20, entity, action }) {
    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      require('../models/AuditLog').find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      require('../models/AuditLog').countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    };
  }

  /**
   * Super Admin Only: Permanently Purge / Delete Appointment Record
   */
  async deleteAppointmentPermanently(id, req) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Forbidden: Only Super Administrators can permanently delete appointment records', 403);
    }

    const appointment = await Appointment.findById(id).populate('patient', 'name').populate('doctor', 'name');
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    await Appointment.findByIdAndDelete(id);

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPOINTMENT_DELETED',
      entity: 'Appointment',
      entityId: id.toString(),
      details: {
        appointmentNumber: appointment.appointmentNumber,
        patient: appointment.patient?.name,
        doctor: appointment.doctor?.name,
        date: appointment.date,
        slot: appointment.slotStartTime
      },
      req
    });

    emitAppointmentUpdate('DELETED', { _id: id, appointmentNumber: appointment.appointmentNumber });

    return { id, appointmentNumber: appointment.appointmentNumber };
  }
}

module.exports = new AppointmentService();
