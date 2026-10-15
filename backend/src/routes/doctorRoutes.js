const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createDoctorSchema, createReceptionistSchema, scheduleSchema } = require('../validators');

// Public or Authenticated: list doctors
router.get('/', authenticate, doctorController.getAllDoctors);

// Super Admin only: create doctors & receptionists
router.post('/', authenticate, authorize('SUPER_ADMIN'), validate(createDoctorSchema), doctorController.createDoctor);
router.post('/receptionists', authenticate, authorize('SUPER_ADMIN'), validate(createReceptionistSchema), doctorController.createReceptionist);

// Schedule management: Super Admin or Doctor viewing schedule
router.get('/:doctorId/schedule', authenticate, doctorController.getDoctorSchedule);
router.put('/:doctorId/schedule', authenticate, authorize('SUPER_ADMIN'), validate(scheduleSchema), doctorController.updateDoctorSchedule);

// Super Admin only: delete/deactivate doctor & cascade cancel active slots
router.delete('/:doctorId', authenticate, authorize('SUPER_ADMIN'), doctorController.deleteDoctor);

module.exports = router;
