'use strict';
const CatalogService = require('../services/CatalogService');

class CatalogController {
  static async search(req, res) {
    try {
      const { q, category, yearMin, yearMax, page = 1, limit = 20 } = req.query;
      const result = await CatalogService.searchBooks({
        q, category, yearMin, yearMax,
        page:  Math.max(1, parseInt(page, 10)   || 1),
        limit: Math.min(100, parseInt(limit, 10) || 20),
      });
      return res.json(result);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] CatalogController.search error:`, err);
      return res.status(500).json({ error: 'Search failed', status: 500 });
    }
  }

  static async getById(req, res) {
    try {
      const book = await CatalogService.getBookById(req.params.bookId);
      if (!book) return res.status(404).json({ error: 'Book not found', status: 404 });
      return res.json({ book });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] CatalogController.getById error:`, err);
      return res.status(500).json({ error: 'Failed to fetch book', status: 500 });
    }
  }

  static async create(req, res) {
    try {
      const { title, author, isbn, category, year, totalCopies } = req.body;
      const book = await CatalogService.createBook({ title, author, isbn, category, year, totalCopies });
      return res.status(201).json({ book });
    } catch (err) {
      if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message, status: 400 });
      console.error(`[${new Date().toISOString()}] CatalogController.create error:`, err);
      return res.status(500).json({ error: 'Failed to create book', status: 500 });
    }
  }

  static async update(req, res) {
    try {
      const { title, author, isbn, category, year, totalCopies } = req.body;
      const book = await CatalogService.updateBook(req.params.bookId, { title, author, isbn, category, year, totalCopies });
      if (!book) return res.status(404).json({ error: 'Book not found', status: 404 });
      return res.json({ book });
    } catch (err) {
      if (err.code === 'NOT_FOUND')   return res.status(404).json({ error: err.message, status: 404 });
      if (err.code === 'VALIDATION')  return res.status(400).json({ error: err.message, status: 400 });
      console.error(`[${new Date().toISOString()}] CatalogController.update error:`, err);
      return res.status(500).json({ error: 'Failed to update book', status: 500 });
    }
  }

  static async remove(req, res) {
    try {
      const result = await CatalogService.softDeleteBook(req.params.bookId);
      if (!result) return res.status(404).json({ error: 'Book not found', status: 404 });
      return res.json({ message: 'Book removed from catalog' });
    } catch (err) {
      if (err.code === 'HAS_ACTIVE_LOANS') return res.status(409).json({ error: err.message, status: 409 });
      console.error(`[${new Date().toISOString()}] CatalogController.remove error:`, err);
      return res.status(500).json({ error: 'Failed to delete book', status: 500 });
    }
  }

  static async importBooks(req, res) {
    try {
      const { books } = req.body;
      const inserted = await CatalogService.importBooks(books);
      return res.status(201).json({ imported: inserted.length, books: inserted });
    } catch (err) {
      if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message, status: 400 });
      console.error(`[${new Date().toISOString()}] CatalogController.importBooks error:`, err);
      return res.status(500).json({ error: 'Import failed', status: 500 });
    }
  }
}

module.exports = CatalogController;
