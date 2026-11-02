const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../services/repoService');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const assignedRole = role === 'admin' ? 'admin' : 'analyst';

    const newUser = await repo.createUser({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      status: 'active'
    });

    const token = generateToken(newUser);

    // Audit log
    await repo.createAuditLog({
      actorId: newUser._id || newUser.id,
      actorName: newUser.name,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser._id || newUser.id,
      details: { email: newUser.email, role: newUser.role }
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await repo.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Please consult an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const token = generateToken(user);

    // Audit log
    await repo.createAuditLog({
      actorId: user._id || user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id || user.id,
      details: { ip: req.ip }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await repo.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
