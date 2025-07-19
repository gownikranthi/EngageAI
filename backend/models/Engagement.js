const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  action: { 
    type: String, 
    enum: ['poll', 'qa', 'download'], 
    required: true 
  },
  metadata: { 
    type: Object 
  }, // e.g., { pollId, question, answer } or { fileName }
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Engagement', engagementSchema); 