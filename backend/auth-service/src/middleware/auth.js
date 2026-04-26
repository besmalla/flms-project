'use strict';
const jwt = require('jsonwebtoken');

// In-memory blacklist — survives only while the process is running.
// For production use Redis: https://redis.io/
const tokenBlacklist = new Set();

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided', status: 401 });
  }

  const token = header.slice(7);

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked', status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user  = decoded;   // { userId, email, role, iat, exp }
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', status: 401 });
    }
    return res.status(401).json({ error: 'Invalid token', status: 401 });
  }
};

// requireRole('admin') or requireRole('librarian', 'admin')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', status: 401 });
  }
  const allowed = roles.flat();
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions', status: 403 });
  }
  next();
};

const addToBlacklist = (token) => tokenBlacklist.add(token);

module.exports = { verifyToken, requireRole, addToBlacklist };
