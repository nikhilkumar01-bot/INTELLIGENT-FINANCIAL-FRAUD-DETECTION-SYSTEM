const repo = require('../services/repoService');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, risk, page = 1, limit = 15 } = req.query;
    const result = await repo.getCustomers({ search, risk, page: Number(page), limit: Number(limit) });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await repo.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found.' });
    }

    // Fetch this customer's transactions
    const txResult = await repo.getTransactions({
      search: customer.customerId,
      limit: 50,
      sort: 'timestamp',
      order: 'desc'
    });

    const txs = txResult.data || [];

    // Behavioral Analytics
    let totalSpent = 0;
    let maxTx = 0;
    const channelCounts = {};
    let flaggedCount = 0;

    for (const t of txs) {
      totalSpent += (t.amount || 0);
      if (t.amount > maxTx) maxTx = t.amount;
      const ch = t.channel || 'OTHER';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      if (t.riskScore >= 60 || t.finalStatus === 'Flagged') flaggedCount += 1;
    }

    const calculatedAvg = txs.length > 0 ? Number((totalSpent / txs.length).toFixed(2)) : customer.avgAmount;

    res.json({
      success: true,
      customer,
      analytics: {
        totalTransactions: txs.length,
        totalSpent: Number(totalSpent.toFixed(2)),
        calculatedAverage: calculatedAvg,
        maxTransaction: Number(maxTx.toFixed(2)),
        flaggedTransactions: flaggedCount,
        channelDistribution: channelCounts
      },
      transactions: txs
    });
  } catch (err) {
    next(err);
  }
};
