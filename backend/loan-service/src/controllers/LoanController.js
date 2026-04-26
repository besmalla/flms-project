'use strict';
const LoanService = require('../services/LoanService');

class LoanController {
  static async borrow(req, res) {
    try {
      const { bookId } = req.body;
      if (!bookId) return res.status(400).json({ error: 'bookId is required', status: 400 });

      const result = await LoanService.borrowBook(req.user.userId, bookId, req.user.role);
      return res.status(201).json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND')       return res.status(404).json({ error: err.message, status: 404 });
      if (err.code === 'UNAVAILABLE')     return res.status(409).json({ error: err.message, status: 409 });
      if (err.code === 'DUPLICATE_LOAN')  return res.status(409).json({ error: err.message, status: 409 });
      if (err.code === 'QUOTA_EXCEEDED')  return res.status(429).json({ error: err.message, status: 429 });
      console.error(`[${new Date().toISOString()}] LoanController.borrow error:`, err);
      return res.status(500).json({ error: 'Borrow failed', status: 500 });
    }
  }

  static async returnBook(req, res) {
    try {
      const { loanId } = req.body;
      if (!loanId) return res.status(400).json({ error: 'loanId is required', status: 400 });

      const result = await LoanService.returnBook(loanId, req.user.userId, req.user.role);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND')        return res.status(404).json({ error: err.message, status: 404 });
      if (err.code === 'ALREADY_RETURNED') return res.status(409).json({ error: err.message, status: 409 });
      if (err.code === 'FORBIDDEN')        return res.status(403).json({ error: err.message, status: 403 });
      console.error(`[${new Date().toISOString()}] LoanController.returnBook error:`, err);
      return res.status(500).json({ error: 'Return failed', status: 500 });
    }
  }

  static async renew(req, res) {
    try {
      const { loanId } = req.body;
      if (!loanId) return res.status(400).json({ error: 'loanId is required', status: 400 });

      const loan = await LoanService.renewLoan(loanId, req.user.userId, req.user.role);
      return res.json({ loan });
    } catch (err) {
      if (err.code === 'NOT_FOUND')      return res.status(404).json({ error: err.message, status: 404 });
      if (err.code === 'INVALID_STATUS') return res.status(409).json({ error: err.message, status: 409 });
      if (err.code === 'FORBIDDEN')      return res.status(403).json({ error: err.message, status: 403 });
      if (err.code === 'MAX_RENEWALS')   return res.status(409).json({ error: err.message, status: 409 });
      console.error(`[${new Date().toISOString()}] LoanController.renew error:`, err);
      return res.status(500).json({ error: 'Renewal failed', status: 500 });
    }
  }

  static async getMyLoans(req, res) {
    try {
      const loans = await LoanService.getMyLoans(req.user.userId);
      return res.json({ data: loans });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] LoanController.getMyLoans error:`, err);
      return res.status(500).json({ error: 'Failed to fetch loans', status: 500 });
    }
  }

  static async getHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await LoanService.getLoanHistory(req.user.userId, {
        page:  Math.max(1, parseInt(page, 10)   || 1),
        limit: Math.min(100, parseInt(limit, 10) || 20),
      });
      return res.json(result);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] LoanController.getHistory error:`, err);
      return res.status(500).json({ error: 'Failed to fetch history', status: 500 });
    }
  }

  static async getAllLoans(req, res) {
    try {
      const { page = 1, limit = 20, status, userId } = req.query;
      const result = await LoanService.getAllLoans({
        page:   Math.max(1, parseInt(page, 10)   || 1),
        limit:  Math.min(100, parseInt(limit, 10) || 20),
        status,
        userId,
      });
      return res.json(result);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] LoanController.getAllLoans error:`, err);
      return res.status(500).json({ error: 'Failed to fetch loans', status: 500 });
    }
  }
}

module.exports = LoanController;
