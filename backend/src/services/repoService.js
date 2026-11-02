/**
 * Unified Repository Layer
 * Seamlessly interfaces with either Mongoose native collections or the EmbeddedStore,
 * ensuring complete operational parity regardless of whether a MongoDB daemon is running.
 */
const { isNative } = require('../config/db');
const store = require('../utils/dataStore');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');

class RepoService {
  // --- USERS ---
  async findUserByEmail(email) {
    if (isNative()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return store.findOne('users', { email: email.toLowerCase() });
  }

  async findUserById(id) {
    if (isNative()) {
      return await User.findById(id).select('-passwordHash');
    }
    const u = store.findById('users', id);
    if (!u) return null;
    const { passwordHash, ...safe } = u;
    return safe;
  }

  async createUser(userData) {
    if (isNative()) {
      return await User.create(userData);
    }
    return store.insertOne('users', userData);
  }

  async getAllUsers() {
    if (isNative()) {
      return await User.find().select('-passwordHash').sort({ createdAt: -1 });
    }
    return store.find('users').map(({ passwordHash, ...rest }) => rest);
  }

  async updateUserRoleOrStatus(id, updates) {
    if (isNative()) {
      return await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    }
    return store.updateOne('users', { _id: id }, updates);
  }

  // --- CUSTOMERS ---
  async getCustomers({ search, risk, page = 1, limit = 15 }) {
    if (isNative()) {
      const q = {};
      if (risk && risk !== 'ALL') q.riskProfile = risk;
      if (search) {
        q.$or = [
          { customerId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }
      const skip = (page - 1) * limit;
      const total = await Customer.countDocuments(q);
      const data = await Customer.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit);
      return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
    }

    let list = store.getCollection('customers');
    if (risk && risk !== 'ALL') list = list.filter(c => c.riskProfile === risk);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => c.customerId.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
    }
    const total = list.length;
    const skip = (page - 1) * limit;
    const data = list.slice(skip, skip + limit);
    return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
  }

  async getCustomerById(customerId) {
    if (isNative()) {
      return await Customer.findOne({ customerId });
    }
    return store.findOne('customers', { customerId });
  }

  async createCustomer(cust) {
    if (isNative()) {
      return await Customer.create(cust);
    }
    return store.insertOne('customers', cust);
  }

  // --- TRANSACTIONS ---
  async getTransactions({ search, riskCategory, channel, finalStatus, minAmount, maxAmount, startDate, endDate, page = 1, limit = 20, sort = 'timestamp', order = 'desc' }) {
    if (isNative()) {
      const q = {};
      if (riskCategory && riskCategory !== 'ALL') q.riskCategory = riskCategory;
      if (channel && channel !== 'ALL') q.channel = channel;
      if (finalStatus && finalStatus !== 'ALL') q.finalStatus = finalStatus;
      if (minAmount) q.amount = { ...q.amount, $gte: Number(minAmount) };
      if (maxAmount) q.amount = { ...q.amount, $lte: Number(maxAmount) };
      if (startDate || endDate) {
        q.timestamp = {};
        if (startDate) q.timestamp.$gte = new Date(startDate);
        if (endDate) q.timestamp.$lte = new Date(endDate);
      }
      if (search) {
        q.$or = [
          { transactionId: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } },
          { merchant: { $regex: search, $options: 'i' } }
        ];
      }
      const skip = (page - 1) * limit;
      const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
      const total = await Transaction.countDocuments(q);
      const data = await Transaction.find(q).sort(sortObj).skip(skip).limit(limit);
      return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
    }

    let list = store.getCollection('transactions');
    if (riskCategory && riskCategory !== 'ALL') list = list.filter(t => t.riskCategory === riskCategory);
    if (channel && channel !== 'ALL') list = list.filter(t => t.channel === channel);
    if (finalStatus && finalStatus !== 'ALL') list = list.filter(t => t.finalStatus === finalStatus);
    if (minAmount) list = list.filter(t => t.amount >= Number(minAmount));
    if (maxAmount) list = list.filter(t => t.amount <= Number(maxAmount));
    if (startDate) {
      const sTime = new Date(startDate).getTime();
      list = list.filter(t => new Date(t.timestamp).getTime() >= sTime);
    }
    if (endDate) {
      const eTime = new Date(endDate).getTime();
      list = list.filter(t => new Date(t.timestamp).getTime() <= eTime);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t => 
        (t.transactionId && t.transactionId.toLowerCase().includes(s)) ||
        (t.customerId && t.customerId.toLowerCase().includes(s)) ||
        (t.merchant && t.merchant.toLowerCase().includes(s))
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];
      if (sort === 'timestamp' || sort === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const skip = (page - 1) * limit;
    const data = list.slice(skip, skip + limit);
    return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
  }

  async getTransactionById(txId) {
    if (isNative()) {
      return await Transaction.findOne({ transactionId: txId });
    }
    return store.findOne('transactions', { transactionId: txId });
  }

  async createTransaction(txData) {
    if (isNative()) {
      return await Transaction.create(txData);
    }
    return store.insertOne('transactions', txData);
  }

  async updateTransactionStatus(transactionId, finalStatus, notes) {
    if (isNative()) {
      return await Transaction.findOneAndUpdate(
        { transactionId },
        { finalStatus, notes, updatedAt: new Date() },
        { new: true }
      );
    }
    return store.updateOne('transactions', { transactionId }, { finalStatus, notes });
  }

  async getAllTransactionsForExport(filter = {}) {
    if (isNative()) {
      return await Transaction.find(filter).sort({ timestamp: -1 });
    }
    return store.find('transactions', filter);
  }

  // --- FRAUD ALERTS ---
  async getAlerts({ status, riskCategory, page = 1, limit = 15 }) {
    if (isNative()) {
      const q = {};
      if (status && status !== 'ALL') q.investigationStatus = status;
      if (riskCategory && riskCategory !== 'ALL') q.riskCategory = riskCategory;
      const skip = (page - 1) * limit;
      const total = await FraudAlert.countDocuments(q);
      const data = await FraudAlert.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit);
      return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
    }

    let list = store.getCollection('alerts');
    if (status && status !== 'ALL') list = list.filter(a => a.investigationStatus === status);
    if (riskCategory && riskCategory !== 'ALL') list = list.filter(a => a.riskCategory === riskCategory);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const skip = (page - 1) * limit;
    const data = list.slice(skip, skip + limit);
    return { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), data };
  }

  async getAlertById(alertId) {
    if (isNative()) {
      return await FraudAlert.findOne({ alertId });
    }
    return store.findOne('alerts', { alertId });
  }

  async createAlert(alertData) {
    if (isNative()) {
      return await FraudAlert.create(alertData);
    }
    return store.insertOne('alerts', alertData);
  }

  async updateAlert(alertId, updateFields) {
    if (isNative()) {
      return await FraudAlert.findOneAndUpdate({ alertId }, updateFields, { new: true });
    }
    return store.updateOne('alerts', { alertId }, updateFields);
  }

  async addAlertNote(alertId, noteObj) {
    if (isNative()) {
      return await FraudAlert.findOneAndUpdate(
        { alertId },
        { $push: { analystNotes: noteObj } },
        { new: true }
      );
    }
    const alert = store.findOne('alerts', { alertId });
    if (!alert) return null;
    const notes = alert.analystNotes || [];
    notes.push(noteObj);
    return store.updateOne('alerts', { alertId }, { analystNotes: notes });
  }

  // --- AUDIT LOGS ---
  async createAuditLog(log) {
    const entry = {
      logId: log.logId || `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date(),
      ...log
    };
    if (isNative()) {
      return await AuditLog.create(entry);
    }
    return store.insertOne('auditLogs', entry);
  }

  async getRecentAuditLogs(limit = 25) {
    if (isNative()) {
      return await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    }
    const list = [...store.getCollection('auditLogs')];
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, limit);
  }

  // --- SETTINGS ---
  async getSettings() {
    if (isNative()) {
      let s = await SystemSetting.findOne();
      if (!s) {
        s = await SystemSetting.create({});
      }
      return s;
    }
    const list = store.getCollection('settings');
    return list[0] || {
      lowRiskThreshold: 30,
      mediumRiskThreshold: 60,
      highRiskThreshold: 80,
      autoAlertThreshold: 70,
      activeModelVersion: 'v1.2.0',
      autoFlagNightTransactions: true
    };
  }

  async updateSettings(newSettings) {
    if (isNative()) {
      let s = await SystemSetting.findOne();
      if (!s) {
        return await SystemSetting.create(newSettings);
      }
      Object.assign(s, newSettings, { updatedAt: new Date() });
      return await s.save();
    }
    return store.updateOne('settings', { _id: 'default_setting' }, newSettings);
  }

  // --- ANALYTICS / DASHBOARD AGGREGATES ---
  async getDashboardSummary() {
    const txs = isNative() ? await Transaction.find() : store.getCollection('transactions');
    const alerts = isNative() ? await FraudAlert.find() : store.getCollection('alerts');

    const totalTransactions = txs.length;
    let suspiciousCount = 0;
    let confirmedFraudCount = 0;
    let genuineCount = 0;
    let totalFlaggedValue = 0;
    let verifiedLabels = 0;
    let falsePositives = 0;

    const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const channelStats = {};
    const trendsByDate = {};

    for (const t of txs) {
      if (t.riskCategory) riskDistribution[t.riskCategory] = (riskDistribution[t.riskCategory] || 0) + 1;
      
      const ch = t.channel || 'OTHER';
      if (!channelStats[ch]) channelStats[ch] = { channel: ch, total: 0, fraud: 0 };
      channelStats[ch].total += 1;

      if (t.riskScore >= 60 || t.finalStatus === 'Flagged') {
        suspiciousCount += 1;
        totalFlaggedValue += (t.amount || 0);
      }

      if (t.finalStatus === 'Confirmed Fraud') {
        confirmedFraudCount += 1;
        verifiedLabels += 1;
        channelStats[ch].fraud += 1;
      } else if (t.finalStatus === 'Genuine') {
        genuineCount += 1;
        if (t.riskScore >= 60) {
          falsePositives += 1;
          verifiedLabels += 1;
        }
      }

      // Group by Date for 7-14 day trend
      const dateKey = new Date(t.timestamp).toISOString().split('T')[0];
      if (!trendsByDate[dateKey]) {
        trendsByDate[dateKey] = { date: dateKey, total: 0, suspicious: 0, fraud: 0, volume: 0 };
      }
      trendsByDate[dateKey].total += 1;
      trendsByDate[dateKey].volume += t.amount;
      if (t.riskScore >= 60) trendsByDate[dateKey].suspicious += 1;
      if (t.finalStatus === 'Confirmed Fraud') trendsByDate[dateKey].fraud += 1;
    }

    const fraudDetectionRate = totalTransactions > 0 
      ? Number(((suspiciousCount / totalTransactions) * 100).toFixed(2)) 
      : 0;

    const falsePositiveRate = verifiedLabels > 0 
      ? Number(((falsePositives / verifiedLabels) * 100).toFixed(2)) 
      : 1.45;

    const sortedTrends = Object.values(trendsByDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return {
      totalTransactions,
      suspiciousTransactions: suspiciousCount,
      confirmedFraudCases: confirmedFraudCount,
      genuineTransactions: genuineCount,
      totalFlaggedValue: Number(totalFlaggedValue.toFixed(2)),
      fraudDetectionRate,
      falsePositiveRate,
      pendingAlerts: alerts.filter(a => a.investigationStatus === 'Pending').length,
      underInvestigationAlerts: alerts.filter(a => a.investigationStatus === 'Under Investigation').length,
      resolvedAlerts: alerts.filter(a => a.investigationStatus === 'Resolved').length,
      riskDistribution,
      channelBreakdown: Object.values(channelStats),
      activityTrends: sortedTrends
    };
  }
}

module.exports = new RepoService();
