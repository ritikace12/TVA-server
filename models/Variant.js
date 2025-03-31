const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Time Criminal', 'Political Variant', 'Animal Variant', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Contained', 'Neutralized']
  },
  description: {
    type: String,
    required: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  timeline: {
    type: String,
    required: true
  },
  threatLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Variant', variantSchema); 