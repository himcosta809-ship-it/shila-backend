require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Product = require('./models/Product');
const Order   = require('./models/Order');
const Message = require('./models/Message');
const auth    = require('./auth');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());                        // allow the front-end on any domain
app.use(express.json());

// ── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Admin login ──────────────────────────────────────────────────────────────
// Single hardcoded admin account stored in env vars (no user table needed).
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== 'admin' || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// ── PUBLIC: Products ─────────────────────────────────────────────────────────
// GET /api/products          — all in-stock products
// GET /api/products/:id      — single product
app.get('/api/products', async (req, res) => {
  try {
    const filter = { inStock: true };
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: Contact / messages ───────────────────────────────────────────────
// POST /api/messages   — customer submits contact form
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    const msg = await Message.create({ name, email, subject, message });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC: Orders ───────────────────────────────────────────────────────────
// POST /api/orders   — customer places an order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, email, phone, address, items, total, notes } = req.body;
    if (!customerName || !email || !items?.length || !total) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }
    const order = await Order.create({ customerName, email, phone, address, items, total, notes });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Products CRUD ─────────────────────────────────────────────────────
// GET    /api/admin/products           — all products (incl. out-of-stock)
// POST   /api/admin/products           — create
// PUT    /api/admin/products/:id       — update
// DELETE /api/admin/products/:id       — delete

app.get('/api/admin/products', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products', auth, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Orders ─────────────────────────────────────────────────────────────
// GET /api/admin/orders                — all orders
// PUT /api/admin/orders/:id/status     — update order status

app.get('/api/admin/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── ADMIN: Messages ───────────────────────────────────────────────────────────
// GET  /api/admin/messages             — all messages
// PUT  /api/admin/messages/:id/read    — mark as read
// DELETE /api/admin/messages/:id       — delete

app.get('/api/admin/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/messages/:id/read', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/messages/:id', auth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Dashboard stats ────────────────────────────────────────────────────
app.get('/api/admin/stats', auth, async (req, res) => {
  try {
    const [productCount, orderCount, messageCount, unreadCount, orders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      Order.find({}, 'total status')
    ]);
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    res.json({ productCount, orderCount, messageCount, unreadCount, revenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Seed initial products ──────────────────────────────────────────────
// Call once: POST /api/admin/seed   — populates DB with starter products
app.post('/api/admin/seed', auth, async (req, res) => {
  try {
    const existing = await Product.countDocuments();
    if (existing > 0) return res.json({ message: `Already seeded (${existing} products exist). Delete products first if you want to re-seed.` });

    const starterProducts = [
      { name: 'Crochet Halter Top', price: 1000, category: 'Crochet', description: 'Handmade crochet halter top, perfect for summer. Made with soft cotton yarn.', image: 'assets/halter-top.jpg', featured: true },
      { name: 'Barefoot Beach Sandals', price: 600, category: 'Crochet', description: 'Delicate crochet barefoot sandals. Great for beach or bohemian style.', image: 'assets/barefoot-sandals.jpg' },
      { name: 'Octopus Keyrings', price: 200, category: 'Crochet', description: 'Adorable amigurumi octopus keyrings. Each one is unique and handmade.', image: 'assets/octopus-keyring.jpg', featured: true },
      { name: 'Blue Daisy Choker & Earring Set', price: 450, category: 'Jewelry', description: 'Matching beaded daisy choker with coordinating earrings.', image: 'assets/daisy-choker-set.jpg', featured: true },
      { name: 'Pearl Bridal Hair Vine', price: 800, category: 'Accessories', description: 'Elegant pearl hair vine for brides and special occasions.', image: 'assets/bridal-hair-vine.jpg' },
      { name: 'Daisy Hair Pin', price: 250, category: 'Accessories', description: 'Cute handmade daisy hair pin. Comes in multiple colors.', image: 'assets/daisy-hair-pin.jpg' },
      { name: 'Woolen Sweater', price: 2500, category: 'Knitwear', description: 'Cozy hand-knitted woolen sweater. Warm and durable.', image: '' },
      { name: 'Beaded Rings Set', price: 350, category: 'Jewelry', description: 'Set of 3 handmade beaded rings. Mix and match colors.', image: '' }
    ];

    await Product.insertMany(starterProducts);
    res.json({ message: `Seeded ${starterProducts.length} products successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
