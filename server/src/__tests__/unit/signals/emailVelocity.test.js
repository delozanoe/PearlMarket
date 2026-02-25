const signal = require('../../../services/signals/emailVelocity');
const { createTestDb } = require('../../helpers/testDb');
const { buildTransaction } = require('../../helpers/fixtures');

describe('emailVelocity signal', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  function insertRecentTransaction(email, minutesAgo = 1) {
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO transactions (id, amount, currency, customer_email,
        billing_country, shipping_country, ip_country, card_bin, card_last4,
        product_category, account_age_days, status, created_at, updated_at)
      VALUES (?, 100, 'USD', ?, 'US', 'US', 'US', '411111', '1234', 'Electronics', 30, 'PENDING', ?, ?)
    `).run(require('crypto').randomUUID(), email, createdAt, createdAt);
  }

  test('name is email_velocity', () => {
    expect(signal.name).toBe('email_velocity');
  });

  test('no prior transactions scores 0', () => {
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('1 prior transaction scores 0', () => {
    insertRecentTransaction('customer@example.com', 5);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });

  test('2 prior transactions scores 15', () => {
    insertRecentTransaction('customer@example.com', 3);
    insertRecentTransaction('customer@example.com', 5);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(15);
  });

  test('4 prior transactions scores 25', () => {
    for (let i = 0; i < 4; i++) {
      insertRecentTransaction('customer@example.com', i + 1);
    }
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(25);
    expect(result.severity).toBe('high');
  });

  test('6 prior transactions scores 30', () => {
    for (let i = 0; i < 6; i++) {
      insertRecentTransaction('customer@example.com', i + 1);
    }
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(30);
  });

  test('old transactions (>10min) not counted', () => {
    insertRecentTransaction('customer@example.com', 15);
    insertRecentTransaction('customer@example.com', 20);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });

  test('different email not counted', () => {
    insertRecentTransaction('other@example.com', 3);
    insertRecentTransaction('other@example.com', 5);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });
});
