const mongoose = require('mongoose');

const nexusEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  impact: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Resolved', 'Prevented', 'Ongoing']
  },
  affectedTimelines: [{
    type: String,
    required: true
  }],
  resolution: {
    type: String
  },
  casualties: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NexusEvent', nexusEventSchema); 