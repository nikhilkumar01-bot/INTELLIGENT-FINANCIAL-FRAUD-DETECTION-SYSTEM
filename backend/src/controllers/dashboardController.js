const repo = require('../services/repoService');
const { getDBStatus } = require('../config/db');
const { getMLHealth } = require('../services/mlClient');

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await repo.getDashboardSummary();
    const dbStatus = getDBStatus();
    const mlStatus = await getMLHealth();

    res.json({
      success: true,
      summary,
      systemStatus: {
        database: dbStatus,
        mlEngine: mlStatus
      }
    });
  } catch (err) {
    next(err);
  }
};
