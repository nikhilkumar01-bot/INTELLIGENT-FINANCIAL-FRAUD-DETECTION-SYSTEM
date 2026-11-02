const mongoose = require('mongoose');

const FraudAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  transactionId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  riskScore: { type: Number, required: true, index: true },
  riskCategory: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  reasons: [{ type: String }],
  assignedAnalyst: { type: String, default: 'Unassigned' },
  investigationStatus: { 
    type: String, 
    enum: ['Pending', 'Under Investigation', 'Resolved'], 
    default: 'Pending',
    index: true 
  },
  finalDisposition: { 
    type: String, 
    enum: ['Confirmed Fraud', 'Genuine', 'Undetermined', null], 
    default: null 
  },
  analystNotes: [
    {
      note: { type: String, required: true },
      author: { type: String, default: 'Analyst' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  resolvedBy: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.FraudAlert || mongoose.model('FraudAlert', FraudAlertSchema);
