'use strict';
const { query, getClient } = require('../db');

const BORROW_LIMITS = { student: 5, faculty: 10, librarian: 10, admin: 10 };
const LOAN_DAYS     = { student: 14, faculty: 30, librarian: 30, admin: 30 };
const MAX_RENEWALS  = 2;

class LoanService {
  // Atomic borrow — uses SERIALIZABLE isolation + FOR UPDATE lock so two
  // simultaneous requests for the last copy result in exactly one success.
  static async borrowBook(userId, bookId, userRole) {
    console.log(`[${new Date().toISOString()}] LoanService.borrowBook user=${userId} book=${bookId}`);
    const client = await getClient();

    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Lock the book row; bail immediately if it doesn't exist
      const bookRes = await client.query(
        `SELECT id, title, available_copies, is_deleted
         FROM books WHERE id = $1 FOR UPDATE`,
        [bookId]
      );
      if (!bookRes.rows.length || bookRes.rows[0].is_deleted) {
        await client.query('ROLLBACK');
        const err = new Error('Book not found'); err.code = 'NOT_FOUND'; throw err;
      }
      const book = bookRes.rows[0];

      if (book.available_copies <= 0) {
        await client.query('ROLLBACK');
        const err = new Error('No copies available'); err.code = 'UNAVAILABLE'; throw err;
      }

      // Prevent duplicate active borrow of the same book
      const dupRes = await client.query(
        `SELECT id FROM loans WHERE user_id = $1 AND book_id = $2 AND status = 'active'`,
        [userId, bookId]
      );
      if (dupRes.rows.length) {
        await client.query('ROLLBACK');
        const err = new Error('You already have this book borrowed'); err.code = 'DUPLICATE_LOAN'; throw err;
      }

      // Enforce per-role borrow quota
      const quotaRes = await client.query(
        `SELECT COUNT(*) FROM loans WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );
      const activeCount = parseInt(quotaRes.rows[0].count, 10);
      const limit = BORROW_LIMITS[userRole] || 5;
      if (activeCount >= limit) {
        await client.query('ROLLBACK');
        const err = new Error(`Borrow limit reached (${limit} books for ${userRole} role)`);
        err.code = 'QUOTA_EXCEEDED'; throw err;
      }

      const days    = LOAN_DAYS[userRole] || 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const loanRes = await client.query(
        `INSERT INTO loans (user_id, book_id, due_date, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING *`,
        [userId, bookId, dueDate]
      );

      await client.query(
        `UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = $1`,
        [bookId]
      );

      await client.query('COMMIT');
      return { loan: loanRes.rows[0], book: { id: book.id, title: book.title } };
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* already rolled back */ }
      throw err;
    } finally {
      client.release();
    }
  }

  static async returnBook(loanId, returnedByUserId, returnedByRole) {
    console.log(`[${new Date().toISOString()}] LoanService.returnBook loan=${loanId}`);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const loanRes = await client.query(
        `SELECT l.*, b.title
         FROM loans l JOIN books b ON l.book_id = b.id
         WHERE l.id = $1 FOR UPDATE`,
        [loanId]
      );
      if (!loanRes.rows.length) {
        await client.query('ROLLBACK');
        const err = new Error('Loan not found'); err.code = 'NOT_FOUND'; throw err;
      }
      const loan = loanRes.rows[0];

      if (loan.status === 'returned') {
        await client.query('ROLLBACK');
        const err = new Error('Book already returned'); err.code = 'ALREADY_RETURNED'; throw err;
      }

      const canReturn =
        ['librarian', 'admin'].includes(returnedByRole) ||
        loan.user_id === returnedByUserId;

      if (!canReturn) {
        await client.query('ROLLBACK');
        const err = new Error('This loan does not belong to you'); err.code = 'FORBIDDEN'; throw err;
      }

      await client.query(
        `UPDATE loans SET status = 'returned', returned_at = NOW() WHERE id = $1`,
        [loanId]
      );
      await client.query(
        `UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1`,
        [loan.book_id]
      );

      await client.query('COMMIT');
      return { message: 'Book returned successfully', bookTitle: loan.title };
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw err;
    } finally {
      client.release();
    }
  }

  static async renewLoan(loanId, userId, userRole) {
    console.log(`[${new Date().toISOString()}] LoanService.renewLoan loan=${loanId}`);
    const result = await query('SELECT * FROM loans WHERE id = $1', [loanId]);

    if (!result.rows.length) {
      const err = new Error('Loan not found'); err.code = 'NOT_FOUND'; throw err;
    }
    const loan = result.rows[0];

    if (loan.status !== 'active') {
      const err = new Error('Only active loans can be renewed'); err.code = 'INVALID_STATUS'; throw err;
    }
    if (loan.user_id !== userId) {
      const err = new Error('This loan does not belong to you'); err.code = 'FORBIDDEN'; throw err;
    }
    if (loan.renewals_used >= MAX_RENEWALS) {
      const err = new Error(`Maximum of ${MAX_RENEWALS} renewals reached`); err.code = 'MAX_RENEWALS'; throw err;
    }

    // Extend from current due date (not from today)
    const days       = LOAN_DAYS[userRole] || 14;
    const newDueDate = new Date(loan.due_date);
    newDueDate.setDate(newDueDate.getDate() + days);

    const updated = await query(
      `UPDATE loans
       SET due_date = $1, renewals_used = renewals_used + 1
       WHERE id = $2
       RETURNING *`,
      [newDueDate, loanId]
    );
    return updated.rows[0];
  }

  static async getMyLoans(userId) {
    const result = await query(
      `SELECT
         l.id, l.book_id, l.borrowed_at, l.due_date, l.renewals_used,
         b.title, b.author, b.isbn, b.category,
         CASE WHEN l.due_date < NOW() THEN 'overdue' ELSE 'active' END AS computed_status
       FROM loans l
       JOIN books b ON l.book_id = b.id
       WHERE l.user_id = $1 AND l.status = 'active'
       ORDER BY l.borrowed_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getLoanHistory(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const countRes = await query(
      `SELECT COUNT(*) FROM loans WHERE user_id = $1 AND status = 'returned'`,
      [userId]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await query(
      `SELECT l.id, l.book_id, l.borrowed_at, l.due_date, l.returned_at, l.renewals_used,
              b.title, b.author, b.isbn, b.category
       FROM loans l JOIN books b ON l.book_id = b.id
       WHERE l.user_id = $1 AND l.status = 'returned'
       ORDER BY l.returned_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getAllLoans({ page = 1, limit = 20, status, userId }) {
    const offset = (page - 1) * limit;
    const conds  = [];
    const params = [];
    let i = 1;

    if (status) { conds.push(`l.status = $${i++}`); params.push(status); }
    if (userId) { conds.push(`l.user_id = $${i++}`); params.push(userId); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM loans l ${where}`, params);
    const total    = parseInt(countRes.rows[0].count, 10);

    const dataRes = await query(
      `SELECT
         l.id, l.borrowed_at, l.due_date, l.returned_at, l.renewals_used,
         b.title, b.author,
         u.first_name, u.last_name, u.email, u.role AS user_role,
         CASE WHEN l.due_date < NOW() AND l.status = 'active' THEN 'overdue' ELSE l.status END AS computed_status
       FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.borrowed_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = LoanService;
