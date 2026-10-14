const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // Stored as ISO YYYY-MM-DD for deterministic querying without timezone skew
    required: true,
    index: true
  },
  slotStartTime: {
    type: String, // HH:MM (e.g., '09:00')
    required: true
  },
  slotEndTime: {
    type: String, // HH:MM (e.g., '09:15')
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Arrived', 'Completed', 'Cancelled'],
    default: 'Scheduled',
    index: true
  },
  purpose: {
    type: String,
    trim: true,
    default: 'General Consultation'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  consultationNotes: {
    type: String,
    trim: true,
    default: ''
  },
  cancelledReason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

/**
 * CRUCIAL CONCURRENCY & INTEGRITY INDEX:
 * Partial unique compound index on { doctor: 1, date: 1, slotStartTime: 1 }
 * where status is NOT 'Cancelled'.
 *
 * This enforces at the database level that no doctor can be double-booked for the same date & time slot!
 * If a slot is cancelled, another appointment can safely occupy that slot.
 */
appointmentSchema.index(
  { doctor: 1, date: 1, slotStartTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Scheduled', 'Arrived', 'Completed'] } },
    name: 'unique_active_doctor_slot'
  }
);

// Compound index for efficient scheduler queries (filtering by doctor, date, and status)
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
