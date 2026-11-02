const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  lowRiskThreshold: { type: Number, default: 30 },
  mediumRiskThreshold: { type: Number, default: 60 },
  highRiskThreshold: { type: Number, default: 80 },
  autoAlertThreshold: { type: Number, default: 70 },
  activeModelVersion: { type: String, default: 'v1.2.0' },
  autoFlagNightTransactions: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
