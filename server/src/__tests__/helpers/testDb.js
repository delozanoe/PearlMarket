const { getTestDb } = require('../../config/database');

function createTestDb() {
  return getTestDb();
}

module.exports = { createTestDb };
