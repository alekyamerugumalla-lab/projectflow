const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const commentRoutes = require('./routes/comments');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ server });
const clients = new Map(); // userId -> ws

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.userId) {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    if (ws.userId) clients.delete(ws.userId);
  });
});

// Broadcast to all project members
app.locals.broadcast = (userIds, event) => {
  userIds.forEach(uid => {
    const client = clients.get(uid);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
};

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/comments', authenticateToken, commentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
