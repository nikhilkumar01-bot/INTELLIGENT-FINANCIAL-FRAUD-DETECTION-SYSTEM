const repo = require('../services/repoService');

exports.getReportSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, range = '30d' } = req.query;

    let start = null;
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const now = new Date();
      if (range === '7d') start = new Date(now.setDate(now.getDate() - 7));
      else if (range === '30d') start = new Date(now.setDate(now.getDate() - 30));
      else if (range === '90d') start = new Date(now.setDate(now.getDate() - 90));
    }

    const txResult = await repo.getTransactions({
      startDate: start ? start.toISOString() : null,
      endDate: end.toISOString(),
      limit: 5000
    });

    const txs = txResult.data || [];

    let totalVolume = 0;
    let flaggedCount = 0;
    let confirmedFraud = 0;
    let genuineCount = 0;
    let totalFlaggedVolume = 0;
    const channelMap = {};
    const riskMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    for (const t of txs) {
      totalVolume += (t.amount || 0);
      if (t.riskCategory) riskMap[t.riskCategory] = (riskMap[t.riskCategory] || 0) + 1;

      const ch = t.channel || 'OTHER';
      if (!channelMap[ch]) channelMap[ch] = { channel: ch, count: 0, volume: 0, fraudCount: 0 };
      channelMap[ch].count += 1;
      channelMap[ch].volume += (t.amount || 0);

      if (t.riskScore >= 60 || t.finalStatus === 'Flagged') {
        flaggedCount += 1;
        totalFlaggedVolume += (t.amount || 0);
      }

      if (t.finalStatus === 'Confirmed Fraud') {
        confirmedFraud += 1;
        channelMap[ch].fraudCount += 1;
      } else if (t.finalStatus === 'Genuine') {
        genuineCount += 1;
      }
    }

    const fraudRate = txs.length > 0 ? Number(((flaggedCount / txs.length) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        dateRange: { start: start ? start.toISOString().split('T')[0] : 'All Time', end: end.toISOString().split('T')[0] },
        sampleSize: txs.length
      },
      metrics: {
        totalTransactions: txs.length,
        totalVolume: Number(totalVolume.toFixed(2)),
        flaggedCount,
        totalFlaggedVolume: Number(totalFlaggedVolume.toFixed(2)),
        confirmedFraud,
        genuineCount,
        fraudRate
      },
      channelBreakdown: Object.values(channelMap),
      riskDistribution: riskMap
    });
  } catch (err) {
    next(err);
  }
};
