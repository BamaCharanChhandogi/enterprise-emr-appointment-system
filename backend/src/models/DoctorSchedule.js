const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  name: { type: String, default: 'Break' },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM']
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  name: { type: String, default: 'Session' },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM']
  }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessions: [sessionSchema],
  breaks: [breakSchema],
  slotDuration: {
    type: Number,
    required: true,
    default: 15, // in minutes
    min: 5,
    max: 120
  }
}, { _id: false });

const doctorScheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One master schedule configuration per doctor
  },
  weeklySchedule: [dayScheduleSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
