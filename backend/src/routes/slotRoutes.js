const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middlewares/auth');

// GET /api/v1/slots?doctorId=xxx&date=YYYY-MM-DD
router.get('/', authenticate, doctorController.getAvailableSlots);

module.exports = router;
