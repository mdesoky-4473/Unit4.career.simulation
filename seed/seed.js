const client = require('../db/client');
const bcrypt = require('bcryptjs'); 

async function seed() {
  try {
    await client.connect();

    // Drop tables if they exist
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS cart_items;`);

    // Create the users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user'
      );
    `);

    // Create the products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        image_url TEXT,
        stock_quantity INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        UNIQUE (user_id, product_id)
      );
    `);

    // Seed sample products
    await client.query(`
      INSERT INTO products (name, description, price, image_url, stock_quantity)
      VALUES 
        ('Wireless Mouse', 'Ergonomic and battery-powered', 29.99, 'https://via.placeholder.com/150', 100),
        ('Bluetooth Headphones', 'Noise-cancelling over-ear', 99.99, 'https://via.placeholder.com/150', 50),
        ('USB-C Hub', 'Multiport adapter with HDMI and USB 3.0', 39.99, 'https://via.placeholder.com/150', 75),
        ('Laptop Stand', 'Aluminum adjustable stand', 49.99, 'https://via.placeholder.com/150', 60),
        ('Mechanical Keyboard', 'Backlit keys and fast response', 89.99, 'https://via.placeholder.com/150', 80);
    `);

    // Create an admin user

    const SALT_ROUNDS = 10;
    const hashedAdminPassword = await bcrypt.hash('adminpass', SALT_ROUNDS);
    await client.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ('admin', 'admin@example.com', $1, 'admin');
    `, [hashedAdminPassword]);

    console.log('Database seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
}

seed();
