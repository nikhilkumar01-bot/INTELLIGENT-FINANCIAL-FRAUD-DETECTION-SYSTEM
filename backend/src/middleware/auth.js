const jwt = require('jsonwebtoken');
const repo = require('../services/repoService');

const JWT_SECRET = process.env.JWT_SECRET || 'demo_fraud_detection_jwt_secret_key_2026_super_secure!';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await repo.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User no longer exists.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact administrator.' });
    }

    req.user = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};

module.exports = { authenticate, JWT_SECRET };
