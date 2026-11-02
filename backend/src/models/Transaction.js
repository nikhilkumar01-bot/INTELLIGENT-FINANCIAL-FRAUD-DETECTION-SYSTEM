const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  transactionType: { type: String, default: 'CARD' },
  channel: { type: String, default: 'CARD' },
  timestamp: { type: Date, default: Date.now, index: true },
  merchant: { type: String, default: 'General Retailer' },
  location: { type: String, default: 'New York, USA' },
  deviceId: { type: String, default: 'DEV_DEFAULT' },
  customerAvgAmount: { type: Number, required: true },
  amountToAvgRatio: { type: Number, default: 1.0 },
  txVelocity1h: { type: Number, default: 1 },
  isNewDevice: { type: Number, default: 0 },
  isNewLocation: { type: Number, default: 0 },
  isNightTx: { type: Number, default: 0 },
  historicalFraudCount: { type: Number, default: 0 },
  daysSinceLastTx: { type: Number, default: 1.0 },
  riskScore: { type: Number, required: true, index: true },
  riskCategory: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW', index: true },
  anomalyScore: { type: Number, default: 0 },
  supervisedProbability: { type: Number, default: 0 },
  predictedClass: { type: Number, default: 0 },
  finalStatus: { 
    type: String, 
    enum: ['Pending Review', 'Flagged', 'Confirmed Fraud', 'Genuine'], 
    default: 'Genuine',
    index: true 
  },
  reasons: [{ type: String }],
  modelVersion: { type: String, default: 'v1.2.0' },
  detector: { type: String, default: 'ml_ensemble_random_forest_isolation_forest' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
