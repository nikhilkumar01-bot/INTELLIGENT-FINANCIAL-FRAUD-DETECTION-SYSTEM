const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../services/repoService');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (user) => {
  const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : '');
  return jwt.sign(
    { id: userId, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { name, email, password, role } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanName = name.trim();
    const rawRole = (role || '').toString().trim().toLowerCase();
    const assignedRole = rawRole === 'admin' ? 'admin' : 'analyst';

    // Check if user already exists
    const existing = await repo.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Persist new user
    const newUser = await repo.createUser({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      status: 'active'
    });

    const userId = (newUser._id || newUser.id || '').toString();

    // Generate JWT token
    const token = generateToken({
      _id: userId,
      id: userId,
      email: cleanEmail,
      role: assignedRole
    });

    // Audit log (non-blocking)
    try {
      await repo.createAuditLog({
        actorId: userId,
        actorName: cleanName,
        actorRole: assignedRole,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: userId,
        details: { email: cleanEmail, role: assignedRole }
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Non-critical audit log creation failed during register:', auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages || 'User validation failed.' });
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error occurred during registration. Please try again.'
    });
  }
};

exports.login = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const user = await repo.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Please consult an administrator.' });
    }

    const isMatch = await bcrypt.compare(password.toString(), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const userId = (user._id || user.id || '').toString();
    const token = generateToken({
      _id: userId,
      id: userId,
      email: user.email,
      role: user.role
    });

    // Audit log (non-blocking)
    try {
      await repo.createAuditLog({
        actorId: userId,
        actorName: user.name,
        actorRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: userId,
        details: { ip: req.ip }
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Non-critical audit log creation failed during login:', auditErr.message);
    }

    return res.json({
      success: true,
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error occurred during login. Please try again.'
    });
  }
};

exports.getMe = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const user = await repo.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const userId = (user._id || user.id || '').toString();
    return res.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve user profile.'
    });
  }
};
