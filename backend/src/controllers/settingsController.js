const repo = require('../services/repoService');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await repo.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const {
      lowRiskThreshold,
      mediumRiskThreshold,
      highRiskThreshold,
      autoAlertThreshold,
      autoFlagNightTransactions
    } = req.body;

    const newValues = {};
    if (lowRiskThreshold !== undefined) newValues.lowRiskThreshold = Number(lowRiskThreshold);
    if (mediumRiskThreshold !== undefined) newValues.mediumRiskThreshold = Number(mediumRiskThreshold);
    if (highRiskThreshold !== undefined) newValues.highRiskThreshold = Number(highRiskThreshold);
    if (autoAlertThreshold !== undefined) newValues.autoAlertThreshold = Number(autoAlertThreshold);
    if (autoFlagNightTransactions !== undefined) newValues.autoFlagNightTransactions = Boolean(autoFlagNightTransactions);

    const updated = await repo.updateSettings(newValues);

    // Audit log
    await repo.createAuditLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SETTINGS_UPDATED',
      entityType: 'SystemSetting',
      entityId: 'global_settings',
      details: newValues
    });

    res.json({ success: true, settings: updated });
  } catch (err) {
    next(err);
  }
};
