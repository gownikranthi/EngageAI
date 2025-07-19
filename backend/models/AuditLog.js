const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'create', 'update', 'delete'
  entity: { type: String, required: true }, // e.g., 'Event'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object }, // Additional info (before/after, etc.)
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 