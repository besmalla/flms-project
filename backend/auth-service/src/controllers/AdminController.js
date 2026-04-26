'use strict';
const UserService = require('../services/UserService');

class AdminController {
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const result = await UserService.getAllUsers({
        page:  Math.max(1, parseInt(page, 10)  || 1),
        limit: Math.min(100, parseInt(limit, 10) || 20),
        role,
        search,
      });
      return res.json(result);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] AdminController.getUsers error:`, err);
      return res.status(500).json({ error: 'Failed to fetch users', status: 500 });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await UserService.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found', status: 404 });
      return res.json({ user });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] AdminController.getUserById error:`, err);
      return res.status(500).json({ error: 'Failed to fetch user', status: 500 });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      if (!role) return res.status(400).json({ error: 'role is required', status: 400 });

      const user = await UserService.updateUserRole(req.params.userId, role);
      if (!user) return res.status(404).json({ error: 'User not found', status: 404 });
      return res.json({ user });
    } catch (err) {
      if (err.code === 'INVALID_ROLE') return res.status(400).json({ error: err.message, status: 400 });
      console.error(`[${new Date().toISOString()}] AdminController.updateUserRole error:`, err);
      return res.status(500).json({ error: 'Failed to update role', status: 500 });
    }
  }

  static async deactivateUser(req, res) {
    try {
      if (req.params.userId === req.user.userId) {
        return res.status(400).json({ error: 'Cannot deactivate your own account', status: 400 });
      }
      const user = await UserService.deactivateUser(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found', status: 404 });
      return res.json({ user });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] AdminController.deactivateUser error:`, err);
      return res.status(500).json({ error: 'Failed to deactivate user', status: 500 });
    }
  }
}

module.exports = AdminController;
