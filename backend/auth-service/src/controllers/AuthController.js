/**
 * Authentication Controller
 * Handles user registration, login, logout, and token verification
 */
'use strict';
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const UserService    = require('../services/UserService');
const { addToBlacklist } = require('../middleware/auth');

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, department } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'email, password, firstName, and lastName are required', status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format', status: 400 });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters', status: 400 });
      }
      if (firstName.trim().length < 1 || lastName.trim().length < 1) {
        return res.status(400).json({ error: 'First and last name cannot be blank', status: 400 });
      }

      const user = await UserService.createUser({ email, password, firstName, lastName, role, department });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );

      return res.status(201).json({ token, user });
    } catch (err) {
      if (err.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: err.message, status: 409 });
      if (err.code === 'INVALID_ROLE')   return res.status(400).json({ error: err.message, status: 400 });
      console.error(`[${new Date().toISOString()}] register error:`, err);
      return res.status(500).json({ error: 'Registration failed', status: 500 });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required', status: 400 });
      }

      const user = await UserService.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials', status: 401 });
      if (!user.is_active) return res.status(401).json({ error: 'Account has been deactivated', status: 401 });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials', status: 401 });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );

      const { password_hash, ...safeUser } = user;
      return res.json({ token, user: safeUser });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] login error:`, err);
      return res.status(500).json({ error: 'Login failed', status: 500 });
    }
  }

  static async logout(req, res) {
    try {
      addToBlacklist(req.token);
      return res.json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] logout error:`, err);
      return res.status(500).json({ error: 'Logout failed', status: 500 });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await UserService.findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found', status: 404 });
      return res.json({ user });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] getProfile error:`, err);
      return res.status(500).json({ error: 'Failed to load profile', status: 500 });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, department } = req.body;
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'firstName and lastName are required', status: 400 });
      }
      const user = await UserService.updateProfile(req.user.userId, { firstName, lastName, department });
      if (!user) return res.status(404).json({ error: 'User not found', status: 404 });
      return res.json({ user });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] updateProfile error:`, err);
      return res.status(500).json({ error: 'Failed to update profile', status: 500 });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword are required', status: 400 });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters', status: 400 });
      }
      await UserService.changePassword(req.user.userId, { currentPassword, newPassword });
      return res.json({ message: 'Password updated successfully' });
    } catch (err) {
      if (err.code === 'INVALID_PASSWORD') return res.status(400).json({ error: err.message, status: 400 });
      if (err.code === 'NOT_FOUND')        return res.status(404).json({ error: err.message, status: 404 });
      console.error(`[${new Date().toISOString()}] resetPassword error:`, err);
      return res.status(500).json({ error: 'Failed to update password', status: 500 });
    }
  }
}

module.exports = AuthController;
