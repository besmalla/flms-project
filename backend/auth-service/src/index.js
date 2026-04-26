/**
 * Auth Service - User Authentication & Management
 * Developed by: Rabah Messai
 * Responsibilities: User registration, login, JWT auth middleware
 */
'use strict';
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { verifyToken, requireRole } = require('./middleware/auth');
const AuthController  = require('./controllers/AuthController');
const AdminController = require('./controllers/AdminController');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// Request/response logger
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] → ${req.method} ${req.path}`);
  res.on('finish', () =>
    console.log(`[${new Date().toISOString()}] ← ${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`)
  );
  next();
});

// ── Auth endpoints ──────────────────────────────────────────────────────────
app.post('/api/auth/register',        AuthController.register);
app.post('/api/auth/login',           AuthController.login);
app.post('/api/auth/logout',          verifyToken, AuthController.logout);
app.get( '/api/auth/profile',         verifyToken, AuthController.getProfile);
app.put( '/api/auth/profile',         verifyToken, AuthController.updateProfile);
app.post('/api/auth/reset-password',  verifyToken, AuthController.resetPassword);

// ── Admin endpoints (admin role only) ───────────────────────────────────────
app.get(  '/api/admin/users',                     verifyToken, requireRole('admin'), AdminController.getUsers);
app.get(  '/api/admin/users/:userId',             verifyToken, requireRole('admin'), AdminController.getUserById);
app.patch('/api/admin/users/:userId/role',        verifyToken, requireRole('admin'), AdminController.updateUserRole);
app.patch('/api/admin/users/:userId/deactivate',  verifyToken, requireRole('admin'), AdminController.deactivateUser);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() })
);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.path}:`, err);
  res.status(500).json({ error: 'Internal server error', status: 500 });
});

app.listen(PORT, () =>
  console.log(`[${new Date().toISOString()}] Auth Service running on http://localhost:${PORT}`)
);

module.exports = app;
