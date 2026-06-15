const express = require('express');
const { db, uuidv4 } = require('../models/db');
const router = express.Router();

// Get all projects for user
router.get('/', (req, res) => {
  const memberOf = db.projectMembers.filter(pm => pm.userId === req.user.id).map(pm => pm.projectId);
  const projects = db.projects.filter(p => memberOf.includes(p.id));
  const enriched = projects.map(p => {
    const members = db.projectMembers.filter(pm => pm.projectId === p.id).map(pm => {
      const u = db.users.find(u => u.id === pm.userId);
      return u ? { id: u.id, name: u.name, avatar: u.avatar, role: pm.role } : null;
    }).filter(Boolean);
    const taskCount = db.tasks.filter(t => t.projectId === p.id).length;
    return { ...p, members, taskCount };
  });
  res.json(enriched);
});

// Create project
router.post('/', (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const project = {
    id: uuidv4(), name, description: description || '', color: color || '#6366f1',
    createdBy: req.user.id, createdAt: new Date().toISOString(), columns: ['To Do', 'In Progress', 'Review', 'Done']
  };
  db.projects.push(project);
  db.projectMembers.push({ projectId: project.id, userId: req.user.id, role: 'owner' });

  res.status(201).json({ ...project, members: [{ id: req.user.id, name: req.user.name, role: 'owner' }], taskCount: 0 });
});

// Get single project
router.get('/:id', (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const isMember = db.projectMembers.find(pm => pm.projectId === project.id && pm.userId === req.user.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const members = db.projectMembers.filter(pm => pm.projectId === project.id).map(pm => {
    const u = db.users.find(u => u.id === pm.userId);
    return u ? { id: u.id, name: u.name, avatar: u.avatar, role: pm.role } : null;
  }).filter(Boolean);

  res.json({ ...project, members });
});

// Update project
router.put('/:id', (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const member = db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === req.user.id);
  if (!member || member.role !== 'owner') return res.status(403).json({ error: 'Only owner can update' });

  db.projects[idx] = { ...db.projects[idx], ...req.body, id: req.params.id };
  res.json(db.projects[idx]);
});

// Delete project
router.delete('/:id', (req, res) => {
  const member = db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === req.user.id);
  if (!member || member.role !== 'owner') return res.status(403).json({ error: 'Only owner can delete' });

  db.projects = db.projects.filter(p => p.id !== req.params.id);
  db.projectMembers = db.projectMembers.filter(pm => pm.projectId !== req.params.id);
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id);
  res.json({ success: true });
});

// Invite member
router.post('/:id/members', (req, res) => {
  const { userId, role } = req.body;
  const ownerCheck = db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === req.user.id);
  if (!ownerCheck || ownerCheck.role !== 'owner') return res.status(403).json({ error: 'Only owner can invite' });

  if (db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === userId))
    return res.status(409).json({ error: 'Already a member' });

  db.projectMembers.push({ projectId: req.params.id, userId, role: role || 'member' });

  // Notify new member
  const project = db.projects.find(p => p.id === req.params.id);
  db.notifications.push({ id: uuidv4(), userId, type: 'project_invite', message: `You've been added to project "${project.name}"`, projectId: req.params.id, read: false, createdAt: new Date().toISOString() });
  req.app.locals.broadcast([userId], { type: 'notification', message: `You've been added to "${project.name}"` });

  const user = db.users.find(u => u.id === userId);
  res.json({ id: user.id, name: user.name, avatar: user.avatar, role: role || 'member' });
});

// Remove member
router.delete('/:id/members/:userId', (req, res) => {
  const ownerCheck = db.projectMembers.find(pm => pm.projectId === req.params.id && pm.userId === req.user.id);
  if (!ownerCheck || ownerCheck.role !== 'owner') return res.status(403).json({ error: 'Only owner can remove' });
  db.projectMembers = db.projectMembers.filter(pm => !(pm.projectId === req.params.id && pm.userId === req.params.userId));
  res.json({ success: true });
});

// Get notifications
router.get('/notifications/all', (req, res) => {
  const notifs = db.notifications.filter(n => n.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

// Mark notification read
router.put('/notifications/:id/read', (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

module.exports = router;
