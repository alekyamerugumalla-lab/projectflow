const express = require('express');
const { db, uuidv4 } = require('../models/db');
const router = express.Router();

const checkMember = (projectId, userId) => db.projectMembers.find(pm => pm.projectId === projectId && pm.userId === userId);

// Get tasks for a project
router.get('/project/:projectId', (req, res) => {
  if (!checkMember(req.params.projectId, req.user.id)) return res.status(403).json({ error: 'Access denied' });
  const tasks = db.tasks.filter(t => t.projectId === req.params.projectId).map(enrichTask);
  res.json(tasks);
});

function enrichTask(task) {
  const assignee = task.assigneeId ? db.users.find(u => u.id === task.assigneeId) : null;
  const commentCount = db.comments.filter(c => c.taskId === task.id).length;
  return {
    ...task,
    assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
    commentCount
  };
}

// Create task
router.post('/', (req, res) => {
  const { projectId, title, description, status, priority, assigneeId, dueDate, column } = req.body;
  if (!checkMember(projectId, req.user.id)) return res.status(403).json({ error: 'Access denied' });
  if (!title) return res.status(400).json({ error: 'Title required' });

  const task = {
    id: uuidv4(), projectId, title, description: description || '', status: status || 'todo',
    priority: priority || 'medium', assigneeId: assigneeId || null, dueDate: dueDate || null,
    column: column || 'To Do', createdBy: req.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  db.tasks.push(task);

  // Notify assignee
  if (assigneeId && assigneeId !== req.user.id) {
    const notif = { id: uuidv4(), userId: assigneeId, type: 'task_assigned', message: `You were assigned to task "${title}"`, taskId: task.id, read: false, createdAt: new Date().toISOString() };
    db.notifications.push(notif);
    req.app.locals.broadcast([assigneeId], { type: 'notification', message: notif.message, task });
  }

  // Notify project members of new task
  const memberIds = db.projectMembers.filter(pm => pm.projectId === projectId && pm.userId !== req.user.id).map(pm => pm.userId);
  req.app.locals.broadcast(memberIds, { type: 'task_created', task: enrichTask(task) });

  res.status(201).json(enrichTask(task));
});

// Update task
router.put('/:id', (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!checkMember(db.tasks[idx].projectId, req.user.id)) return res.status(403).json({ error: 'Access denied' });

  const oldTask = db.tasks[idx];
  db.tasks[idx] = { ...oldTask, ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
  const updated = db.tasks[idx];

  // Notify if assignee changed
  if (req.body.assigneeId && req.body.assigneeId !== oldTask.assigneeId && req.body.assigneeId !== req.user.id) {
    const notif = { id: uuidv4(), userId: req.body.assigneeId, type: 'task_assigned', message: `You were assigned to task "${updated.title}"`, taskId: updated.id, read: false, createdAt: new Date().toISOString() };
    db.notifications.push(notif);
    req.app.locals.broadcast([req.body.assigneeId], { type: 'notification', message: notif.message });
  }

  const memberIds = db.projectMembers.filter(pm => pm.projectId === updated.projectId && pm.userId !== req.user.id).map(pm => pm.userId);
  req.app.locals.broadcast(memberIds, { type: 'task_updated', task: enrichTask(updated) });

  res.json(enrichTask(updated));
});

// Delete task
router.delete('/:id', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!checkMember(task.projectId, req.user.id)) return res.status(403).json({ error: 'Access denied' });

  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  db.comments = db.comments.filter(c => c.taskId !== req.params.id);

  const memberIds = db.projectMembers.filter(pm => pm.projectId === task.projectId && pm.userId !== req.user.id).map(pm => pm.userId);
  req.app.locals.broadcast(memberIds, { type: 'task_deleted', taskId: req.params.id });

  res.json({ success: true });
});

module.exports = router;
