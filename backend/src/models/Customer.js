const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  avgAmount: { type: Number, required: true },
  maxAmount: { type: Number, default: 0 },
  typicalHourRange: { type: String, default: "08:00 - 22:00" },
  typicalChannels: [{ type: String }],
  riskProfile: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  recentTransactionsCount: { type: Number, default: 0 },
  historicalFraudCount: { type: Number, default: 0 },
  primaryLocation: { type: String, default: 'New York, USA' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
