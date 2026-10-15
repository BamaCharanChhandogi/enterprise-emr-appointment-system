const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const { AppError } = require('../utils/apiResponse');
const { logAction } = require('./auditService');
const emailService = require('./emailService');

// Helper: converts "09:30" to minutes from midnight (570)
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: converts minutes (570) back to "09:30"
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

class DoctorService {
  async getAllDoctors(filter = {}) {
    const query = { role: 'DOCTOR', isActive: true };
    if (filter.department) {
      query.department = new RegExp(filter.department, 'i');
    }
    if (filter.search) {
      query.name = new RegExp(filter.search, 'i');
    }

    return await User.find(query).select('name email role department phone');
  }

  async createDoctor(doctorData, req) {
    const existing = await User.findOne({ email: doctorData.email });
    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const doctor = await User.create({
      ...doctorData,
      role: 'DOCTOR'
    });

    // Initialize default schedule for the doctor (Mon - Fri, 9am - 5pm, 15m slots, 12-1pm lunch break)
    const defaultWeeklySchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
      day,
      isActive: true,
      slotDuration: 15,
      sessions: [
        { name: 'Morning Session', startTime: '09:00', endTime: '12:00' },
        { name: 'Evening Session', startTime: '13:00', endTime: '17:00' }
      ],
      breaks: [
        { name: 'Lunch Break', startTime: '12:00', endTime: '13:00' }
      ]
    }));

    await DoctorSchedule.create({
      doctor: doctor._id,
      weeklySchedule: defaultWeeklySchedule
    });

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'DOCTOR_CREATED',
      entity: 'User',
      entityId: doctor._id.toString(),
      details: { doctorName: doctor.name, department: doctor.department },
      req
    });

    // Send invitation email with temporary credentials asynchronously
    emailService.sendStaffInviteEmail({
      to: doctor.email,
      name: doctor.name,
      role: 'Attending Physician (Doctor)',
      department: doctor.department,
      temporaryPassword: doctorData.password,
      loginUrl: req.headers?.origin || process.env.CLIENT_URL
    }).catch(err => console.error('Staff invite email error:', err.message));

    return doctor;
  }

  async createReceptionist(receptionistData, req) {
    const existing = await User.findOne({ email: receptionistData.email });
    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const receptionist = await User.create({
      ...receptionistData,
      role: 'RECEPTIONIST'
    });

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'RECEPTIONIST_CREATED',
      entity: 'User',
      entityId: receptionist._id.toString(),
      details: { name: receptionist.name, email: receptionist.email },
      req
    });

    // Send invitation email with temporary credentials asynchronously
    emailService.sendStaffInviteEmail({
      to: receptionist.email,
      name: receptionist.name,
      role: 'Front Desk Receptionist',
      department: 'Admissions & Lobby Operations',
      temporaryPassword: receptionistData.password,
      loginUrl: req.headers?.origin || process.env.CLIENT_URL
    }).catch(err => console.error('Staff invite email error:', err.message));

    return receptionist;
  }

  async deleteDoctor(doctorId, req) {
    const doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR' });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Cancel any active future/today appointments for this doctor
    const today = new Date().toISOString().split('T')[0];
    const activeAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: today },
      status: { $in: ['Scheduled', 'Arrived'] }
    });

    for (const app of activeAppointments) {
      app.status = 'Cancelled';
      app.cancelledReason = `Physician removed from staff directory by Super Admin (${req.user.name})`;
      await app.save();
    }

    // Remove Doctor Schedule
    await DoctorSchedule.deleteOne({ doctor: doctorId });

    // Delete User record
    await User.findByIdAndDelete(doctorId);

    // Record compliance audit log
    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'DOCTOR_DELETED',
      entity: 'User',
      entityId: doctorId.toString(),
      details: {
        doctorName: doctor.name,
        department: doctor.department,
        cancelledUpcomingCount: activeAppointments.length
      },
      req
    });

    return {
      deletedDoctorId: doctorId,
      doctorName: doctor.name,
      cancelledAppointments: activeAppointments.length
    };
  }

  async getDoctorSchedule(doctorId) {
    let schedule = await DoctorSchedule.findOne({ doctor: doctorId }).populate('doctor', 'name department');
    if (!schedule) {
      // Create empty or default schedule if none exists
      schedule = await DoctorSchedule.create({
        doctor: doctorId,
        weeklySchedule: []
      });
    }
    return schedule;
  }

  async updateDoctorSchedule(doctorId, weeklySchedule, req) {
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new AppError('Doctor not found', 404);
    }

    // Validate that sessions do not overlap breaks or overlap each other
    for (const dayPlan of weeklySchedule) {
      if (!dayPlan.isActive) continue;
      for (const b of (dayPlan.breaks || [])) {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        if (bStart >= bEnd) {
          throw new AppError(`Break start time (${b.startTime}) must be strictly earlier than end time (${b.endTime}) on ${dayPlan.day}`);
        }
      }
      for (const s of (dayPlan.sessions || [])) {
        const sStart = timeToMinutes(s.startTime);
        const sEnd = timeToMinutes(s.endTime);
        if (sStart >= sEnd) {
          throw new AppError(`Session start time (${s.startTime}) must be strictly earlier than end time (${s.endTime}) on ${dayPlan.day}`);
        }
      }
    }

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctor: doctorId },
      { weeklySchedule },
      { new: true, upsert: true, runValidators: true }
    );

    await logAction({
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'SCHEDULE_UPDATED',
      entity: 'DoctorSchedule',
      entityId: schedule._id.toString(),
      details: { doctorId },
      req
    });

    return schedule;
  }

  /**
   * DYNAMIC SLOT GENERATION ENGINE
   * - Respects working days
   * - Respects sessions & breaks
   * - Validates past dates & past time slots
   * - Cross-references active bookings in DB
   */
  async getAvailableSlots({ doctorId, date }) {
    if (!doctorId || !date) {
      throw new AppError('Doctor ID and Date (YYYY-MM-DD) are required', 400);
    }

    // Determine Day of Week for date
    // Create Date safely in UTC/local without zone skew
    const [y, m, d] = date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[targetDate.getDay()];

    // Check past date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = (date === todayStr);

    if (date < todayStr) {
      return {
        date,
        day: targetDayName,
        isPastDate: true,
        slots: []
      };
    }

    const doctorSchedule = await DoctorSchedule.findOne({ doctor: doctorId });
    if (!doctorSchedule) {
      return { date, day: targetDayName, slots: [] };
    }

    const dayConfig = doctorSchedule.weeklySchedule.find(
      s => s.day.toLowerCase() === targetDayName.toLowerCase() && s.isActive
    );

    if (!dayConfig) {
      return {
        date,
        day: targetDayName,
        message: `Doctor is not scheduled to work on ${targetDayName}`,
        slots: []
      };
    }

    // Fetch existing active appointments for this doctor and date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      status: { $ne: 'Cancelled' }
    }).select('slotStartTime slotEndTime status appointmentNumber');

    const bookedSlotsMap = new Map();
    bookedAppointments.forEach(app => {
      bookedSlotsMap.set(app.slotStartTime, app);
    });

    const slotDuration = dayConfig.slotDuration || 15;
    const breaks = (dayConfig.breaks || []).map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
      name: b.name
    }));

    const currentMinutesNow = isToday ? (today.getHours() * 60 + today.getMinutes()) : -1;
    const generatedSlots = [];

    // Iterate through all sessions
    for (const session of dayConfig.sessions) {
      const sessionStart = timeToMinutes(session.startTime);
      const sessionEnd = timeToMinutes(session.endTime);

      let currentSlotStart = sessionStart;

      while (currentSlotStart + slotDuration <= sessionEnd) {
        const currentSlotEnd = currentSlotStart + slotDuration;
        const startTimeStr = minutesToTime(currentSlotStart);
        const endTimeStr = minutesToTime(currentSlotEnd);

        // Check if slot overlaps with ANY break interval
        // Overlap condition: slotStart < breakEnd && slotEnd > breakStart
        const isInBreak = breaks.some(b => currentSlotStart < b.end && currentSlotEnd > b.start);

        if (!isInBreak) {
          const isPastTime = isToday && (currentSlotStart <= currentMinutesNow);
          const isBooked = bookedSlotsMap.has(startTimeStr);
          const bookingInfo = bookedSlotsMap.get(startTimeStr);

          generatedSlots.push({
            startTime: startTimeStr,
            endTime: endTimeStr,
            duration: slotDuration,
            sessionName: session.name || 'Session',
            isAvailable: !isBooked && !isPastTime,
            isBooked,
            isPastTime,
            appointmentId: bookingInfo ? bookingInfo._id : null,
            status: isBooked ? bookingInfo.status : (isPastTime ? 'Expired' : 'Available')
          });
        }

        currentSlotStart += slotDuration;
      }
    }

    return {
      date,
      day: targetDayName,
      totalSlots: generatedSlots.length,
      availableSlotsCount: generatedSlots.filter(s => s.isAvailable).length,
      bookedSlotsCount: generatedSlots.filter(s => s.isBooked).length,
      slots: generatedSlots
    };
  }
}

module.exports = new DoctorService();
