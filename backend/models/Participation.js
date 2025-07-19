const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
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
  joinTime: { 
    type: Date, 
    default: Date.now 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate participations
participationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema); 