const createApp = require('../../app');
const { createTestDb } = require('./testDb');

function createTestApp() {
  const db = createTestDb();
  const app = createApp(db);
  return { app, db };
}

module.exports = { createTestApp };
