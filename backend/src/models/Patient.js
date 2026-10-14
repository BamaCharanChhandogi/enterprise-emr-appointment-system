const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  age: {
    type: Number,
    min: 0,
    max: 130
  },
  address: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Text index for fast patient search by ID, phone, name
patientSchema.index({ name: 'text', phone: 'text', patientId: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
