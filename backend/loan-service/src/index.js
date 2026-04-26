/**
 * Loan Service - Catalog & Loan Management
 * Developed by: Rabah Messai
 * Responsibilities: Book catalog, loan operations, inventory
 */
'use strict';
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { verifyToken, requireRole } = require('./middleware/auth');
const CatalogController = require('./controllers/CatalogController');
const LoanController    = require('./controllers/LoanController');

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] → ${req.method} ${req.path}`);
  res.on('finish', () =>
    console.log(`[${new Date().toISOString()}] ← ${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`)
  );
  next();
});

// ── Catalog endpoints ────────────────────────────────────────────────────────
app.get(   '/api/catalog/search',          verifyToken, CatalogController.search);
app.get(   '/api/catalog/books/:bookId',   verifyToken, CatalogController.getById);
app.post(  '/api/catalog/books',           verifyToken, requireRole('librarian', 'admin'), CatalogController.create);
app.put(   '/api/catalog/books/:bookId',   verifyToken, requireRole('librarian', 'admin'), CatalogController.update);
app.delete('/api/catalog/books/:bookId',   verifyToken, requireRole('librarian', 'admin'), CatalogController.remove);
app.post(  '/api/catalog/import',          verifyToken, requireRole('librarian', 'admin'), CatalogController.importBooks);

// ── Loan endpoints ───────────────────────────────────────────────────────────
app.post('/api/loans/borrow',   verifyToken, requireRole('student', 'faculty', 'librarian', 'admin'), LoanController.borrow);
app.post('/api/loans/return',   verifyToken, LoanController.returnBook);
app.post('/api/loans/renew',    verifyToken, requireRole('student', 'faculty'), LoanController.renew);
app.get( '/api/loans/my-loans', verifyToken, LoanController.getMyLoans);
app.get( '/api/loans/history',  verifyToken, LoanController.getHistory);
app.get( '/api/loans',          verifyToken, requireRole('librarian', 'admin'), LoanController.getAllLoans);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'loan-service', timestamp: new Date().toISOString() })
);

app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.path}:`, err);
  res.status(500).json({ error: 'Internal server error', status: 500 });
});

app.listen(PORT, () =>
  console.log(`[${new Date().toISOString()}] Loan Service running on http://localhost:${PORT}`)
);

module.exports = app;
