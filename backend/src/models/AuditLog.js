const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  actorId: { type: String, required: true },
  actorName: { type: String, default: 'System' },
  actorRole: { type: String, default: 'admin' },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
