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

  test('can insert and retrieve a transaction', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO transactions (id, amount, currency, customer_email,
        billing_country, shipping_country, ip_country, ip_address,
        card_bin, card_last4, product_category, account_age_days,
        fraud_score, risk_level, score_breakdown, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-id', 100.0, 'USD', 'test@example.com',
      'US', 'US', 'US', '1.2.3.4',
      '411111', '1234', 'Electronics', 30,
      45, 'MEDIUM', '[]', 'PENDING', now, now
    );

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get('test-id');
    expect(row).toBeDefined();
    expect(row.amount).toBe(100.0);
    expect(row.status).toBe('PENDING');
  });

  test('initializeSchema is idempotent', () => {
    const { initializeSchema } = require('../../config/database');
    expect(() => initializeSchema(db)).not.toThrow();
    expect(() => initializeSchema(db)).not.toThrow();
  });
});
