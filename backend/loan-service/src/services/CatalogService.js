'use strict';
const { query } = require('../db');

class CatalogService {
  static async searchBooks({ q, category, yearMin, yearMax, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conds  = ['is_deleted = false'];
    const params = [];
    let i = 1;

    if (q) {
      conds.push(`(title ILIKE $${i} OR author ILIKE $${i} OR isbn ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }
    if (category) {
      conds.push(`category ILIKE $${i++}`);
      params.push(`%${category}%`);
    }
    if (yearMin) {
      conds.push(`year >= $${i++}`);
      params.push(parseInt(yearMin, 10));
    }
    if (yearMax) {
      conds.push(`year <= $${i++}`);
      params.push(parseInt(yearMax, 10));
    }

    const where = `WHERE ${conds.join(' AND ')}`;

    const countRes = await query(`SELECT COUNT(*) FROM books ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await query(
      `SELECT id, title, author, isbn, category, year, total_copies, available_copies, created_at
       FROM books ${where}
       ORDER BY title ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getBookById(bookId) {
    const result = await query(
      `SELECT id, title, author, isbn, category, year, total_copies, available_copies, created_at
       FROM books WHERE id = $1 AND is_deleted = false`,
      [bookId]
    );
    return result.rows[0] || null;
  }

  static async createBook({ title, author, isbn, category, year, totalCopies = 1 }) {
    if (!title || !author) {
      const err = new Error('title and author are required');
      err.code = 'VALIDATION';
      throw err;
    }
    const copies = Math.max(1, parseInt(totalCopies, 10) || 1);
    const result = await query(
      `INSERT INTO books (title, author, isbn, category, year, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [title.trim(), author.trim(), isbn || null, category || null, year || null, copies]
    );
    return result.rows[0];
  }

  static async updateBook(bookId, { title, author, isbn, category, year, totalCopies }) {
    const book = await CatalogService.getBookById(bookId);
    if (!book) {
      const err = new Error('Book not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Recalculate available_copies when total changes
    let available = book.available_copies;
    if (totalCopies !== undefined) {
      const newTotal = Math.max(0, parseInt(totalCopies, 10));
      const borrowed = book.total_copies - book.available_copies;
      available = Math.max(0, newTotal - borrowed);
    }

    const result = await query(
      `UPDATE books
       SET title            = COALESCE($1, title),
           author           = COALESCE($2, author),
           isbn             = COALESCE($3, isbn),
           category         = COALESCE($4, category),
           year             = COALESCE($5, year),
           total_copies     = COALESCE($6, total_copies),
           available_copies = $7,
           updated_at       = NOW()
       WHERE id = $8 AND is_deleted = false
       RETURNING *`,
      [
        title    ? title.trim()    : null,
        author   ? author.trim()   : null,
        isbn     !== undefined     ? isbn || null : null,
        category !== undefined     ? category || null : null,
        year     !== undefined     ? year || null : null,
        totalCopies !== undefined  ? Math.max(0, parseInt(totalCopies, 10)) : null,
        available,
        bookId,
      ]
    );
    return result.rows[0] || null;
  }

  static async softDeleteBook(bookId) {
    // Refuse if there are active loans
    const activeLoans = await query(
      `SELECT COUNT(*) FROM loans WHERE book_id = $1 AND status = 'active'`,
      [bookId]
    );
    if (parseInt(activeLoans.rows[0].count, 10) > 0) {
      const err = new Error('Cannot delete a book with active loans');
      err.code = 'HAS_ACTIVE_LOANS';
      throw err;
    }

    const result = await query(
      `UPDATE books SET is_deleted = true, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [bookId]
    );
    return result.rows[0] || null;
  }

  static async importBooks(books) {
    if (!Array.isArray(books) || books.length === 0) {
      const err = new Error('books must be a non-empty array');
      err.code = 'VALIDATION';
      throw err;
    }

    // Validate all before inserting (all-or-nothing)
    for (const [idx, b] of books.entries()) {
      if (!b.title || !b.author) {
        const err = new Error(`books[${idx}]: title and author are required`);
        err.code = 'VALIDATION';
        throw err;
      }
    }

    const inserted = [];
    for (const b of books) {
      const copies = Math.max(1, parseInt(b.totalCopies || b.total_copies, 10) || 1);
      const result = await query(
        `INSERT INTO books (title, author, isbn, category, year, total_copies, available_copies)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         RETURNING *`,
        [b.title.trim(), b.author.trim(), b.isbn || null, b.category || null, b.year || null, copies]
      );
      inserted.push(result.rows[0]);
    }
    return inserted;
  }
}

module.exports = CatalogService;
