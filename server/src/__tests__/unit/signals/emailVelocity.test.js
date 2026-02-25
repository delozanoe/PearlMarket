const signal = require('../../../services/signals/emailVelocity');
const { createTestDb } = require('../../helpers/testDb');
const { buildTransaction } = require('../../helpers/fixtures');

describe('emailVelocity signal', () => {
  let db;

  beforeEach(() => { db = createTestDb(); });
  afterEach(() => { db.close(); });

  function insertRecent(email, minutesAgo = 1) {
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO transactions (id, amount, currency, customer_email,
        billing_country, shipping_country, ip_country, card_bin, card_last4,
        product_category, account_age_days, status, created_at, updated_at)
      VALUES (?, 100, 'USD', ?, 'US', 'US', 'US', '411111', '1234', 'Electronics', 30, 'PENDING', ?, ?)
    `).run(require('crypto').randomUUID(), email, createdAt, createdAt);
  }

  test('no prior scores 0', () => {
    expect(signal.calculate(buildTransaction(), db).score).toBe(0);
  });

  test('2 prior scores 15', () => {
    insertRecent('customer@example.com', 3);
    insertRecent('customer@example.com', 5);
    expect(signal.calculate(buildTransaction(), db).score).toBe(15);
  });

  test('4 prior scores 25', () => {
    for (let i = 0; i < 4; i++) insertRecent('customer@example.com', i + 1);
    expect(signal.calculate(buildTransaction(), db).score).toBe(25);
  });

  test('6 prior scores 30', () => {
    for (let i = 0; i < 6; i++) insertRecent('customer@example.com', i + 1);
    expect(signal.calculate(buildTransaction(), db).score).toBe(30);
  });

  test('old transactions not counted', () => {
    insertRecent('customer@example.com', 15);
    insertRecent('customer@example.com', 20);
    expect(signal.calculate(buildTransaction(), db).score).toBe(0);
  });
});
