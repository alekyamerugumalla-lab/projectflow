const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, uuidv4 } = require('../models/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  if (db.users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashedPassword, avatar: name[0].toUpperCase(), createdAt: new Date().toISOString() };
  db.users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name, email, avatar: user.avatar } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

// Get current user
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar });
});

// Search users (for inviting to projects)
router.get('/users/search', require('../middleware/auth').authenticateToken, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const results = db.users
    .filter(u => u.id !== req.user.id && (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())))
    .map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));
  res.json(results);
});

module.exports = router;
