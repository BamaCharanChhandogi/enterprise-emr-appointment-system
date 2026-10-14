const appointmentService = require('../services/appointmentService');
const { successResponse } = require('../utils/apiResponse');

const searchPatients = async (req, res, next) => {
  try {
    const { query } = req.query;
    const patients = await appointmentService.searchPatients(query);
    return successResponse(res, 200, 'Patients fetched', { patients });
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.bookAppointment(req.body, req);
    return successResponse(res, 201, 'Appointment booked successfully', { appointment });
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      doctorId,
      department,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const result = await appointmentService.getAppointments({
      page,
      limit,
      sortBy,
      sortOrder,
      doctorId,
      department,
      status,
      startDate,
      endDate,
      search,
      user: req.user
    });

    return successResponse(
      res,
      200,
      'Appointments retrieved successfully',
      { appointments: result.appointments },
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(id, req.user);
    return successResponse(res, 200, 'Appointment details fetched', { appointment });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.updateAppointment(id, req.body, req);
    return successResponse(res, 200, 'Appointment updated successfully', { appointment });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const appointment = await appointmentService.cancelAppointment(id, reason, req);
    return successResponse(res, 200, 'Appointment cancelled successfully', { appointment });
  } catch (error) {
    next(error);
  }
};

const markPatientArrived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.markPatientArrived(id, req);
    return successResponse(res, 200, 'Patient marked as Arrived', { appointment });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, entity, action } = req.query;
    const result = await appointmentService.getAuditLogs({ page, limit, entity, action });
    return successResponse(res, 200, 'Audit logs retrieved', { logs: result.logs }, result.pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchPatients,
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  markPatientArrived,
  getAuditLogs
};
