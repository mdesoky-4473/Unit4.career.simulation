const express = require('express');
const router = express.Router();
const client = require('../db/client');
const authenticateToken = require('./authMiddleware'); // protects routes

// GET /api/cart - Get current user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await client.query(`
      SELECT ci.id, ci.quantity, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1;
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart - Add item to cart
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
  
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Product ID and valid quantity required' });
    }
  
    try {
      // Check if item is already in cart
      const existing = await client.query(
        `SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2`,
        [userId, productId]
      );
  
      if (existing.rows.length) {
        // Update the quantity
        const updated = await client.query(
          `UPDATE cart_items
           SET quantity = $1
           WHERE user_id = $2 AND product_id = $3
           RETURNING *`,
          [quantity, userId, productId]
        );
        return res.json({ message: 'Cart item updated', item: updated.rows[0] });
      } else {
        // Insert new cart item
        const inserted = await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [userId, productId, quantity]
        );
        return res.status(201).json({ message: 'Cart item added', item: inserted.rows[0] });
      }
    } catch (err) {
      console.error('Cart error:', err);
      res.status(500).json({ error: 'Failed to add/update cart item' });
    }
  });

// DELETE 
router.delete('/:productId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const productId = req.params.productId;
  
    try {
      const result = await client.query(
        `DELETE FROM cart_items
         WHERE user_id = $1 AND product_id = $2
         RETURNING *`,
        [userId, productId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }
  
      res.json({ message: 'Cart item removed', item: result.rows[0] });
    } catch (err) {
      console.error('Error removing item from cart:', err);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  });

  // CHECKOUT - Clear the cart
router.post('/checkout', authenticateToken, async (req, res) => {
    const userId = req.user.id;
  
    try {
      // Remove all items from this user's cart
      await client.query(
        `DELETE FROM cart_items WHERE user_id = $1`,
        [userId]
      );
  
      res.json({ message: 'Checkout complete. Thank you for your purchase!' });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: 'Checkout failed' });
    }
  });
  

module.exports = router;