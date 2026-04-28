'use strict';
const jwt = require('jsonwebtoken');

// Enhanced Logger for Security Auditing (AI-Ready logs)
const securityLogger = (action, user, status) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY-LOG] ${timestamp} | Action: ${action} | User: ${user || 'Guest'} | Status: ${status}`);
};

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    securityLogger('AUTH_ATTEMPT', null, 'FAIL_NO_TOKEN');
    return res.status(401).json({ error: 'No token provided', status: 401 });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user  = decoded;
    req.token = token;
    next();
  } catch (err) {
    securityLogger('AUTH_ATTEMPT', null, `FAIL_${err.name.toUpperCase()}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', status: 401 });
    }
    return res.status(401).json({ error: 'Invalid token', status: 401 });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    securityLogger('ACCESS_DENIED', null, 'UNAUTHENTICATED');
    return res.status(401).json({ error: 'Authentication required', status: 401 });
  }
  
  const allowed = roles.flat();
  if (!allowed.includes(req.user.role)) {
    securityLogger('RBAC_DENIAL', req.user.userId, `INSUFFICIENT_ROLE_${req.user.role}`);
    return res.status(403).json({ error: 'Insufficient permissions', status: 403 });
  }
  next();
};

module.exports = { verifyToken, requireRole };
