const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: String,
  answer: String,
}, { _id: false });

const EventSummarySchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
  generatedSummary: { type: String },
  keyThemes: [String],
  smartFAQ: [FAQSchema],
}, { timestamps: true });

module.exports = mongoose.model('EventSummary', EventSummarySchema); 