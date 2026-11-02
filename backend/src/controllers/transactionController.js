const { v4: uuidv4 } = require('uuid');
const repo = require('../services/repoService');
const { scoreTransaction } = require('../services/mlClient');

exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      riskCategory,
      channel,
      finalStatus,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sort = 'timestamp',
      order = 'desc'
    } = req.query;

    const result = await repo.getTransactions({
      page: Number(page),
      limit: Number(limit),
      search,
      riskCategory,
      channel,
      finalStatus,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sort,
      order
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tx = await repo.getTransactionById(id);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // Attach customer baseline context if available
    let customer = null;
    if (tx.customerId) {
      customer = await repo.getCustomerById(tx.customerId);
    }

    res.json({ success: true, transaction: tx, customer });
  } catch (err) {
    next(err);
  }
};

exports.analyzeTransaction = async (req, res, next) => {
  try {
    const {
      customerId,
      amount,
      transactionType,
      channel,
      merchant,
      location,
      deviceId,
      txHour,
      txVelocity1h,
      isNewDevice,
      isNewLocation,
      notes
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid transaction amount greater than 0 is required.' });
    }

    // Lookup customer or use defaults
    let customer = null;
    if (customerId) {
      customer = await repo.getCustomerById(customerId);
    }

    const customerAvgAmount = customer ? customer.avgAmount : (Number(amount) * 0.8);
    const customerRiskProfile = customer ? customer.riskProfile : 'LOW';
    const histFraud = customer ? customer.historicalFraudCount : 0;

    const txId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const scoredResult = await scoreTransaction({
      transactionId: txId,
      customerId: customerId || 'CUST-WALK-IN',
      amount: Number(amount),
      customerAvgAmount,
      txHour: txHour !== undefined ? Number(txHour) : new Date().getHours(),
      txVelocity1h: Number(txVelocity1h || 1),
      isNewDevice: Number(isNewDevice || 0),
      isNewLocation: Number(isNewLocation || 0),
      channel: channel || transactionType || 'CARD',
      customerRiskProfile,
      historicalFraudCount: histFraud,
      daysSinceLastTx: 1.0
    });

    const settings = await repo.getSettings();
    const autoAlertLimit = settings.autoAlertThreshold || 70;

    let finalStatus = 'Genuine';
    if (scoredResult.riskScore >= autoAlertLimit) {
      finalStatus = 'Flagged';
    } else if (scoredResult.riskScore >= 40) {
      finalStatus = 'Pending Review';
    }

    const transactionDoc = {
      transactionId: txId,
      customerId: customerId || 'CUST-WALK-IN',
      amount: Number(amount),
      transactionType: transactionType || channel || 'CARD',
      channel: channel || transactionType || 'CARD',
      timestamp: new Date(),
      merchant: merchant || 'Apex Online Merchant',
      location: location || (customer ? customer.primaryLocation : 'New York, USA'),
      deviceId: deviceId || `DEV-${Math.floor(100000 + Math.random() * 900000)}`,
      customerAvgAmount,
      amountToAvgRatio: Number((Number(amount) / (customerAvgAmount + 1e-5)).toFixed(2)),
      txVelocity1h: Number(txVelocity1h || 1),
      isNewDevice: Number(isNewDevice || 0),
      isNewLocation: Number(isNewLocation || 0),
      isNightTx: [0, 1, 2, 3, 4, 5].includes(txHour !== undefined ? Number(txHour) : new Date().getHours()) ? 1 : 0,
      historicalFraudCount: histFraud,
      daysSinceLastTx: 1.0,
      riskScore: scoredResult.riskScore,
      riskCategory: scoredResult.riskCategory,
      anomalyScore: scoredResult.anomalyScore,
      supervisedProbability: scoredResult.supervisedProbability,
      predictedClass: scoredResult.predictedClass,
      finalStatus,
      reasons: scoredResult.reasons,
      modelVersion: scoredResult.modelVersion,
      detector: scoredResult.detector,
      notes: notes || ''
    };

    const savedTx = await repo.createTransaction(transactionDoc);

    // Auto-create alert if criteria met
    let alertCreated = null;
    if (scoredResult.riskScore >= autoAlertLimit) {
      const alertId = `ALT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      alertCreated = await repo.createAlert({
        alertId,
        transactionId: txId,
        customerId: transactionDoc.customerId,
        amount: Number(amount),
        riskScore: scoredResult.riskScore,
        riskCategory: scoredResult.riskCategory,
        reasons: scoredResult.reasons,
        assignedAnalyst: 'Unassigned',
        investigationStatus: 'Pending',
        finalDisposition: null,
        analystNotes: [
          {
            note: `System flagged high risk transaction (${scoredResult.riskScore}/100) via ${scoredResult.detector}.`,
            author: 'System Audit',
            timestamp: new Date()
          }
        ]
      });
    }

    // Record audit log
    await repo.createAuditLog({
      actorId: req.user ? req.user.id : 'ANALYST-PORTAL',
      actorName: req.user ? req.user.name : 'Analyst Portal',
      actorRole: req.user ? req.user.role : 'analyst',
      action: 'TRANSACTION_ANALYZED',
      entityType: 'Transaction',
      entityId: txId,
      details: {
        amount,
        riskScore: scoredResult.riskScore,
        riskCategory: scoredResult.riskCategory,
        alertGenerated: !!alertCreated
      }
    });

    res.status(201).json({
      success: true,
      transaction: savedTx,
      assessment: scoredResult,
      alert: alertCreated
    });
  } catch (err) {
    next(err);
  }
};

exports.exportTransactions = async (req, res, next) => {
  try {
    const transactions = await repo.getAllTransactionsForExport();

    // Generate CSV string
    const headers = [
      'Transaction ID',
      'Customer ID',
      'Amount',
      'Channel',
      'Timestamp',
      'Merchant',
      'Location',
      'Risk Score',
      'Risk Category',
      'Final Status',
      'Detector',
      'Reasons'
    ];

    const rows = transactions.map(t => [
      t.transactionId,
      t.customerId,
      t.amount,
      t.channel,
      new Date(t.timestamp).toISOString(),
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      t.riskScore,
      t.riskCategory,
      t.finalStatus,
      t.detector,
      `"${(t.reasons || []).join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

exports.importTransactions = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of transaction objects.' });
    }

    const processed = [];
    const settings = await repo.getSettings();
    const autoAlertLimit = settings.autoAlertThreshold || 70;

    for (const item of transactions.slice(0, 100)) { // limit batch to 100
      const txId = item.transactionId || `TX-IMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;
      const amount = Number(item.amount) || 50;
      const custAvg = Number(item.customerAvgAmount) || amount;

      const scored = await scoreTransaction({
        transactionId: txId,
        customerId: item.customerId || 'CUST-IMP',
        amount,
        customerAvgAmount: custAvg,
        txHour: item.txHour !== undefined ? Number(item.txHour) : 12,
        txVelocity1h: Number(item.txVelocity1h || 1),
        isNewDevice: Number(item.isNewDevice || 0),
        isNewLocation: Number(item.isNewLocation || 0),
        channel: item.channel || item.transactionType || 'CARD'
      });

      let finalStatus = 'Genuine';
      if (scored.riskScore >= autoAlertLimit) finalStatus = 'Flagged';
      else if (scored.riskScore >= 40) finalStatus = 'Pending Review';

      const doc = {
        transactionId: txId,
        customerId: item.customerId || 'CUST-IMP',
        amount,
        transactionType: item.transactionType || item.channel || 'CARD',
        channel: item.channel || 'CARD',
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        merchant: item.merchant || 'Imported Merchant',
        location: item.location || 'Local Terminal',
        deviceId: item.deviceId || 'DEV-IMP',
        customerAvgAmount: custAvg,
        amountToAvgRatio: Number((amount / (custAvg + 1e-5)).toFixed(2)),
        txVelocity1h: Number(item.txVelocity1h || 1),
        isNewDevice: Number(item.isNewDevice || 0),
        isNewLocation: Number(item.isNewLocation || 0),
        isNightTx: 0,
        riskScore: scored.riskScore,
        riskCategory: scored.riskCategory,
        anomalyScore: scored.anomalyScore,
        supervisedProbability: scored.supervisedProbability,
        predictedClass: scored.predictedClass,
        finalStatus,
        reasons: scored.reasons,
        modelVersion: scored.modelVersion,
        detector: scored.detector
      };

      const saved = await repo.createTransaction(doc);
      processed.push(saved);

      if (scored.riskScore >= autoAlertLimit) {
        await repo.createAlert({
          alertId: `ALT-IMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
          transactionId: txId,
          customerId: doc.customerId,
          amount,
          riskScore: scored.riskScore,
          riskCategory: scored.riskCategory,
          reasons: scored.reasons,
          assignedAnalyst: 'Unassigned',
          investigationStatus: 'Pending',
          analystNotes: [{ note: 'Auto-flagged during bulk batch ingest.', author: 'System' }]
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully processed and scored ${processed.length} imported transactions.`,
      count: processed.length
    });
  } catch (err) {
    next(err);
  }
};
