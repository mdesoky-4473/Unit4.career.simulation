const express = require('express');
const router = express.Router();
const client = require('../db/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware'); 

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {

    console.log('Registering user:', username, email);
    // Check if user already exists
    const userCheck = await client.query(`
      SELECT * FROM users WHERE username = $1 OR email = $2
    `, [username, email]);

    if (userCheck.rows.length) {
      console.log('User already exists');
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('Hashed password:', hashedPassword);

    // Insert the new user
    const result = await client.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email;
    `, [username, email, hashedPassword]);

    console.log('User created:', result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'User registration failed' });
  }
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const result = await client.query(`
      SELECT * FROM users WHERE username = $1
    `, [username]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the hashed password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});


router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user; 

    const result = await client.query(`
      SELECT id, username, email, role
      FROM users
      WHERE id = $1;
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});


module.exports = router;
