'use strict';
const jwt = require('jsonwebtoken');

// Validates JWT issued by auth-service (shared secret).
// Note: blacklisted tokens will still pass here until they expire (24h).
// For strict logout propagation, switch to a shared Redis blacklist.
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided', status: 401 });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user  = decoded;  // { userId, email, role, iat, exp }
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', status: 401 });
    }
    return res.status(401).json({ error: 'Invalid token', status: 401 });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required', status: 401 });
  const allowed = roles.flat();
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions', status: 403 });
  }
  next();
};

module.exports = { verifyToken, requireRole };
