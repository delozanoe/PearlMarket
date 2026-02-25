const signal = require('../../../services/signals/cardBinVelocity');
const { createTestDb } = require('../../helpers/testDb');
const { buildTransaction } = require('../../helpers/fixtures');

describe('cardBinVelocity signal', () => {
  let db;

  beforeEach(() => { db = createTestDb(); });
  afterEach(() => { db.close(); });

  function insertRecent(cardBin, minutesAgo = 1) {
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO transactions (id, amount, currency, customer_email,
        billing_country, shipping_country, ip_country, card_bin, card_last4,
        product_category, account_age_days, status, created_at, updated_at)
      VALUES (?, 100, 'USD', 'test@test.com', 'US', 'US', 'US', ?, '1234', 'Electronics', 30, 'PENDING', ?, ?)
    `).run(require('crypto').randomUUID(), cardBin, createdAt, createdAt);
  }

  test('no prior scores 0', () => {
    expect(signal.calculate(buildTransaction(), db).score).toBe(0);
  });

  test('2 prior scores 10', () => {
    insertRecent('411111', 5);
    insertRecent('411111', 10);
    expect(signal.calculate(buildTransaction(), db).score).toBe(10);
  });

  test('4 prior scores 15', () => {
    for (let i = 0; i < 4; i++) insertRecent('411111', i + 1);
    expect(signal.calculate(buildTransaction(), db).score).toBe(15);
  });

  test('old transactions not counted', () => {
    insertRecent('411111', 35);
    insertRecent('411111', 40);
    expect(signal.calculate(buildTransaction(), db).score).toBe(0);
  });
});
