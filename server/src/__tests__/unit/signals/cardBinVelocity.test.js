const signal = require('../../../services/signals/cardBinVelocity');
const { createTestDb } = require('../../helpers/testDb');
const { buildTransaction } = require('../../helpers/fixtures');

describe('cardBinVelocity signal', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  function insertRecentTransaction(cardBin, minutesAgo = 1) {
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO transactions (id, amount, currency, customer_email,
        billing_country, shipping_country, ip_country, card_bin, card_last4,
        product_category, account_age_days, status, created_at, updated_at)
      VALUES (?, 100, 'USD', 'test@test.com', 'US', 'US', 'US', ?, '1234', 'Electronics', 30, 'PENDING', ?, ?)
    `).run(require('crypto').randomUUID(), cardBin, createdAt, createdAt);
  }

  test('name is card_bin_velocity', () => {
    expect(signal.name).toBe('card_bin_velocity');
  });

  test('no prior transactions scores 0', () => {
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('1 prior transaction scores 0', () => {
    insertRecentTransaction('411111', 5);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });

  test('2 prior transactions scores 10', () => {
    insertRecentTransaction('411111', 5);
    insertRecentTransaction('411111', 10);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(10);
    expect(result.severity).toBe('medium');
  });

  test('4 prior transactions scores 15', () => {
    for (let i = 0; i < 4; i++) {
      insertRecentTransaction('411111', i + 1);
    }
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(15);
    expect(result.severity).toBe('high');
  });

  test('old transactions (>30min) not counted', () => {
    insertRecentTransaction('411111', 35);
    insertRecentTransaction('411111', 40);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });

  test('different BIN not counted', () => {
    insertRecentTransaction('522222', 5);
    insertRecentTransaction('522222', 10);
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });
});
