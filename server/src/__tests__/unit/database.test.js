const { createTestDb } = require('../helpers/testDb');

describe('Database', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  test('creates transactions table', () => {
    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
    ).get();
    expect(table).toBeDefined();
    expect(table.name).toBe('transactions');
  });

  test('transactions table has expected columns', () => {
    const columns = db.prepare('PRAGMA table_info(transactions)').all();
    const columnNames = columns.map((c) => c.name);

    const expected = [
      'id', 'amount', 'currency', 'customer_email',
      'billing_country', 'shipping_country', 'ip_country', 'ip_address',
      'card_bin', 'card_last4', 'product_category', 'account_age_days',
      'fraud_score', 'risk_level', 'score_breakdown', 'status',
      'created_at', 'updated_at',
    ];

    for (const col of expected) {
      expect(columnNames).toContain(col);
    }
  });

  test('creates indexes on key columns', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='transactions'"
    ).all();
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain('idx_transactions_customer_email');
    expect(indexNames).toContain('idx_transactions_card_bin');
    expect(indexNames).toContain('idx_transactions_created_at');
    expect(indexNames).toContain('idx_transactions_status');
    expect(indexNames).toContain('idx_transactions_risk_level');
  });

  test('status column defaults to PENDING', () => {
    const columns = db.prepare('PRAGMA table_info(transactions)').all();
    const statusCol = columns.find((c) => c.name === 'status');
    expect(statusCol.dflt_value).toBe("'PENDING'");
  });

  test('creates blocked_entities table', () => {
    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='blocked_entities'"
    ).get();
    expect(table).toBeDefined();
  });

  test('creates settings table with defaults', () => {
    const rows = db.prepare('SELECT * FROM settings').all();
    expect(rows.length).toBe(2);
    const keys = rows.map((r) => r.key);
    expect(keys).toContain('auto_approve_below');
    expect(keys).toContain('auto_block_above');
  });

  test('initializeSchema is idempotent', () => {
    const { initializeSchema } = require('../../config/database');
    expect(() => initializeSchema(db)).not.toThrow();
    expect(() => initializeSchema(db)).not.toThrow();
  });
});
