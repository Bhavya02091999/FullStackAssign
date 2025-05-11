const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema({
  driveId: {
    type: String,
    required: true
  },
  vaccineName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
});

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  vaccinations: [VaccinationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
