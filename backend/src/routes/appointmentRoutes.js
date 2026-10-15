const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createAppointmentSchema, updateAppointmentSchema } = require('../validators');

// Patient search (Receptionist & Super Admin)
router.get('/patients/search', authenticate, authorize('SUPER_ADMIN', 'RECEPTIONIST'), appointmentController.searchPatients);

// Audit logs (Super Admin)
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN'), appointmentController.getAuditLogs);

// Core Appointment Endpoints
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'RECEPTIONIST'),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get(
  '/',
  authenticate,
  appointmentController.getAppointments
);

router.get(
  '/:id',
  authenticate,
  appointmentController.getAppointmentById
);

router.put(
  '/:id',
  authenticate,
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'RECEPTIONIST'),
  appointmentController.cancelAppointment
);

// Super Admin Only: Permanently delete/purge appointment record
router.delete(
  '/:id/permanent',
  authenticate,
  authorize('SUPER_ADMIN'),
  appointmentController.deleteAppointmentPermanently
);

router.post(
  '/:id/arrive',
  authenticate,
  authorize('SUPER_ADMIN', 'RECEPTIONIST'),
  appointmentController.markPatientArrived
);

module.exports = router;
