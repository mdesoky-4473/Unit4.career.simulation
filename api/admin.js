const express = require('express');
const router = express.Router();
const client = require('../db/client');
const authenticateToken = require('./authMiddleware');
const requireAdmin = require('./requireAdmin'); 

// Middleware to check for admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/users - Get all user data (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await client.query(`
      SELECT id, username, email, role
      FROM users
      ORDER BY id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
