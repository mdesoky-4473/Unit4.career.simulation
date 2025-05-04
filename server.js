const express = require('express');
const morgan = require('morgan');
const client = require('./db/client'); // This is your pg.Client connection

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Import routes
const userRouter = require('./api/users');
app.use('/api/users', userRouter);

const productRouter = require('./api/products');
app.use('/api/products', productRouter);

const cartRouter = require('./api/cart');
app.use('/api/cart', cartRouter);

const adminRouter = require('./api/admin');
app.use('/api/admin', adminRouter);


// Test route
app.get('/', (req, res) => {
  res.send('Welcome to the e-commerce backend!');
});

// Start server and connect to DB
app.listen(PORT, async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Failed to connect to the database', err);
  }
  console.log(`Server is running on http://localhost:${PORT}`);
});
