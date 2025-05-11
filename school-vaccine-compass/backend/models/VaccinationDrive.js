
const mongoose = require('mongoose');

const VaccinationDriveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  vaccineName: {
    type: String,
    required: true
  },
  totalDoses: {
    type: Number,
    required: true
  },
  usedDoses: {
    type: Number,
    default: 0
  },
  targetClasses: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('VaccinationDrive', VaccinationDriveSchema);
