const express = require('express');
const { db, uuidv4 } = require('../models/db');
const router = express.Router();

// Get comments for a task
router.get('/task/:taskId', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const isMember = db.projectMembers.find(pm => pm.projectId === task.projectId && pm.userId === req.user.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const comments = db.comments.filter(c => c.taskId === req.params.taskId).map(c => {
    const user = db.users.find(u => u.id === c.userId);
    return { ...c, user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null };
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json(comments);
});

// Add comment
router.post('/', (req, res) => {
  const { taskId, text } = req.body;
  if (!text || !taskId) return res.status(400).json({ error: 'taskId and text required' });

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const isMember = db.projectMembers.find(pm => pm.projectId === task.projectId && pm.userId === req.user.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const comment = { id: uuidv4(), taskId, userId: req.user.id, text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.comments.push(comment);

  const user = db.users.find(u => u.id === req.user.id);
  const enriched = { ...comment, user: { id: user.id, name: user.name, avatar: user.avatar } };

  // Notify other members
  const memberIds = db.projectMembers.filter(pm => pm.projectId === task.projectId && pm.userId !== req.user.id).map(pm => pm.userId);
  memberIds.forEach(uid => {
    const notif = { id: uuidv4(), userId: uid, type: 'comment', message: `${user.name} commented on "${task.title}"`, taskId, read: false, createdAt: new Date().toISOString() };
    db.notifications.push(notif);
  });
  req.app.locals.broadcast(memberIds, { type: 'new_comment', comment: enriched, taskId });

  res.status(201).json(enriched);
});

// Update comment
router.put('/:id', (req, res) => {
  const idx = db.comments.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (db.comments[idx].userId !== req.user.id) return res.status(403).json({ error: 'Can only edit your own comments' });

  db.comments[idx] = { ...db.comments[idx], text: req.body.text, updatedAt: new Date().toISOString() };
  const user = db.users.find(u => u.id === req.user.id);
  res.json({ ...db.comments[idx], user: { id: user.id, name: user.name, avatar: user.avatar } });
});

// Delete comment
router.delete('/:id', (req, res) => {
  const comment = db.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (comment.userId !== req.user.id) return res.status(403).json({ error: 'Can only delete your own comments' });

  db.comments = db.comments.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

module.exports = router;
