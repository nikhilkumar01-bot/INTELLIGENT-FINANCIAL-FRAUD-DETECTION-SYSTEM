const repo = require('../services/repoService');

exports.getAlerts = async (req, res, next) => {
  try {
    const { status, riskCategory, page = 1, limit = 15 } = req.query;
    const result = await repo.getAlerts({
      status,
      riskCategory,
      page: Number(page),
      limit: Number(limit)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await repo.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Fraud alert not found.' });
    }

    // Attach related transaction
    let transaction = null;
    if (alert.transactionId) {
      transaction = await repo.getTransactionById(alert.transactionId);
    }

    // Attach related customer
    let customer = null;
    if (alert.customerId) {
      customer = await repo.getCustomerById(alert.customerId);
    }

    res.json({ success: true, alert, transaction, customer });
  } catch (err) {
    next(err);
  }
};

exports.updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { investigationStatus, assignedAnalyst, finalDisposition, note } = req.body;

    const alert = await repo.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Fraud alert not found.' });
    }

    const updates = {};
    if (investigationStatus) updates.investigationStatus = investigationStatus;
    if (assignedAnalyst) updates.assignedAnalyst = assignedAnalyst;
    if (finalDisposition !== undefined) updates.finalDisposition = finalDisposition;

    if (finalDisposition) {
      updates.resolvedBy = req.user ? req.user.name : 'Analyst';
      updates.resolvedAt = new Date();
      updates.investigationStatus = 'Resolved';

      // Synchronize transaction status
      const txStatus = finalDisposition === 'Confirmed Fraud' ? 'Confirmed Fraud' : 'Genuine';
      await repo.updateTransactionStatus(
        alert.transactionId,
        txStatus,
        `Resolved by analyst ${req.user ? req.user.name : 'Analyst'}: ${finalDisposition}`
      );
    }

    const updatedAlert = await repo.updateAlert(id, updates);

    // If note provided
    if (note) {
      await repo.addAlertNote(id, {
        note,
        author: req.user ? req.user.name : 'Analyst',
        timestamp: new Date()
      });
    }

    // Audit Log
    await repo.createAuditLog({
      actorId: req.user ? req.user.id : 'ANALYST',
      actorName: req.user ? req.user.name : 'Analyst',
      actorRole: req.user ? req.user.role : 'analyst',
      action: 'ALERT_UPDATED',
      entityType: 'FraudAlert',
      entityId: id,
      details: {
        investigationStatus: updates.investigationStatus,
        finalDisposition: updates.finalDisposition,
        assignedAnalyst: updates.assignedAnalyst
      }
    });

    const refreshed = await repo.getAlertById(id);
    res.json({ success: true, alert: refreshed });
  } catch (err) {
    next(err);
  }
};

exports.addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    const alert = await repo.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Fraud alert not found.' });
    }

    const noteObj = {
      note: note.trim(),
      author: req.user ? req.user.name : 'Analyst',
      timestamp: new Date()
    };

    await repo.addAlertNote(id, noteObj);

    // Audit log
    await repo.createAuditLog({
      actorId: req.user ? req.user.id : 'ANALYST',
      actorName: req.user ? req.user.name : 'Analyst',
      actorRole: req.user ? req.user.role : 'analyst',
      action: 'ALERT_NOTE_ADDED',
      entityType: 'FraudAlert',
      entityId: id,
      details: { snippet: note.slice(0, 60) }
    });

    const refreshed = await repo.getAlertById(id);
    res.json({ success: true, alert: refreshed });
  } catch (err) {
    next(err);
  }
};
