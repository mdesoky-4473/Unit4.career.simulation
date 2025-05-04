const express = require('express');
const router = express.Router();
const client = require('../db/client');

router.get('/', async (req, res) => {
  try {
    const { rows } = await client.query('SELECT * FROM products;');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;
