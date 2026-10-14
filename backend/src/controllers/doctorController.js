const doctorService = require('../services/doctorService');
const { successResponse } = require('../utils/apiResponse');

const getAllDoctors = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const doctors = await doctorService.getAllDoctors({ department, search });
    return successResponse(res, 200, 'Doctors fetched successfully', { doctors });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.createDoctor(req.body, req);
    return successResponse(res, 201, 'Doctor created successfully', { doctor });
  } catch (error) {
    next(error);
  }
};

const createReceptionist = async (req, res, next) => {
  try {
    const receptionist = await doctorService.createReceptionist(req.body, req);
    return successResponse(res, 201, 'Receptionist created successfully', { receptionist });
  } catch (error) {
    next(error);
  }
};

const getDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const schedule = await doctorService.getDoctorSchedule(doctorId);
    return successResponse(res, 200, 'Doctor schedule fetched successfully', { schedule });
  } catch (error) {
    next(error);
  }
};

const updateDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { weeklySchedule } = req.body;
    const schedule = await doctorService.updateDoctorSchedule(doctorId, weeklySchedule, req);
    return successResponse(res, 200, 'Doctor schedule updated successfully', { schedule });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    const slotData = await doctorService.getAvailableSlots({ doctorId, date });
    return successResponse(res, 200, 'Slots generated successfully', slotData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDoctors,
  createDoctor,
  createReceptionist,
  getDoctorSchedule,
  updateDoctorSchedule,
  getAvailableSlots
};
