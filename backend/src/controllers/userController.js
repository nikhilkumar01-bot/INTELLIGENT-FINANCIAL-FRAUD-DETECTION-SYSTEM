const repo = require('../services/repoService');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await repo.getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const updates = {};
    if (role && ['admin', 'analyst'].includes(role)) updates.role = role;
    if (status && ['active', 'suspended'].includes(status)) updates.status = status;

    const updated = await repo.updateUserRoleOrStatus(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Audit log
    await repo.createAuditLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_MODIFIED',
      entityType: 'User',
      entityId: id,
      details: updates
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await repo.getRecentAuditLogs(50);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
