// In-memory database (replace with real DB in production)
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  projects: [],
  projectMembers: [], // { projectId, userId, role }
  tasks: [],
  comments: [],
  notifications: [],
};

// Helper functions
const findById = (collection, id) => db[collection].find(item => item.id === id);
const findAll = (collection, predicate) => db[collection].filter(predicate);

module.exports = { db, findById, findAll, uuidv4 };
