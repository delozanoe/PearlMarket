const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function initializeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      billing_country TEXT NOT NULL,
      shipping_country TEXT NOT NULL,
      ip_country TEXT NOT NULL,
      ip_address TEXT,
      card_bin TEXT NOT NULL,
      card_last4 TEXT NOT NULL,
      product_category TEXT NOT NULL,
      account_age_days INTEGER NOT NULL,
      fraud_score INTEGER,
      risk_level TEXT,
      score_breakdown TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_customer_email ON transactions(customer_email);
    CREATE INDEX IF NOT EXISTS idx_transactions_card_bin ON transactions(card_bin);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON transactions(risk_level);

    CREATE TABLE IF NOT EXISTS blocked_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_value TEXT NOT NULL,
      block_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(entity_type, entity_value)
    );

    CREATE INDEX IF NOT EXISTS idx_blocked_entities_lookup ON blocked_entities(entity_type, entity_value);
  `);
}

function getDb(dbPath) {
  if (!dbPath) {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'pearlmarket.db');
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);
  return db;
}

function getTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);
  return db;
}

module.exports = { getDb, getTestDb, initializeSchema };
