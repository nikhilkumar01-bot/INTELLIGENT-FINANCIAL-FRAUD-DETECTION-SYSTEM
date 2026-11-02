const { getMLMetrics, getMLHealth } = require('../services/mlClient');

exports.getModelStatus = async (req, res, next) => {
  try {
    const health = await getMLHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    next(err);
  }
};

exports.getModelMetrics = async (req, res, next) => {
  try {
    const metrics = await getMLMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
};
