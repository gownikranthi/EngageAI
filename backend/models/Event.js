const mongoose = require('mongoose');

// --- Poll Schemas (from previous step) ---
const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [PollOptionSchema],
  isActive: { type: Boolean, default: false }
});

// --- NEW: Question Schema ---
const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, required: true }, // Store name for convenience
  isAnswered: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true } // Auto-approve for now
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false },
  polls: [PollSchema],
  // Add the questions array to the schema
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema); 