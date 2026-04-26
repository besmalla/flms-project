'use strict';
const bcrypt = require('bcryptjs');
const { query } = require('../db');

const SELF_REGISTER_ROLES = ['student', 'faculty'];
const ALL_ROLES = ['student', 'faculty', 'librarian', 'admin'];

class UserService {
  static async createUser({ email, password, firstName, lastName, role = 'student', department }) {
    console.log(`[${new Date().toISOString()}] UserService.createUser email=${email}`);

    if (!SELF_REGISTER_ROLES.includes(role)) {
      const err = new Error('Self-registration is only allowed for student and faculty roles');
      err.code = 'INVALID_ROLE';
      throw err;
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      const err = new Error('Email address is already registered');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, department, is_active, created_at`,
      [email.toLowerCase(), hash, firstName.trim(), lastName.trim(), role, department || null]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, department, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  static async findById(userId) {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, department, is_active, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async updateProfile(userId, { firstName, lastName, department }) {
    const result = await query(
      `UPDATE users
       SET first_name = $1, last_name = $2, department = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, first_name, last_name, role, department, is_active`,
      [firstName.trim(), lastName.trim(), department || null, userId]
    );
    return result.rows[0] || null;
  }

  static async changePassword(userId, { currentPassword, newPassword }) {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!result.rows.length) {
      const err = new Error('User not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      const err = new Error('Current password is incorrect');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
    return true;
  }

  static async getAllUsers({ page = 1, limit = 20, role, search }) {
    const offset = (page - 1) * limit;
    const conds = [];
    const params = [];
    let i = 1;

    if (role && ALL_ROLES.includes(role)) {
      conds.push(`role = $${i++}`);
      params.push(role);
    }
    if (search) {
      conds.push(`(email ILIKE $${i} OR first_name ILIKE $${i} OR last_name ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await query(
      `SELECT id, email, first_name, last_name, role, department, is_active, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async updateUserRole(userId, role) {
    if (!ALL_ROLES.includes(role)) {
      const err = new Error(`Invalid role. Must be one of: ${ALL_ROLES.join(', ')}`);
      err.code = 'INVALID_ROLE';
      throw err;
    }
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, first_name, last_name, role, department, is_active`,
      [role, userId]
    );
    return result.rows[0] || null;
  }

  static async deactivateUser(userId) {
    const result = await query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1
       RETURNING id, email, first_name, last_name, is_active`,
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserService;
