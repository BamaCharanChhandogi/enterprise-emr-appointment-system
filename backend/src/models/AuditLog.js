const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    default: 'System / Anonymous'
  },
  role: {
    type: String,
    default: 'SYSTEM'
  },
  action: {
    type: String,
    required: true,
    index: true // e.g., 'LOGIN', 'APPOINTMENT_CREATED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED'
  },
  entity: {
    type: String,
    required: true // e.g., 'Appointment', 'User', 'DoctorSchedule', 'Patient'
  },
  entityId: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
