const { scoreTransaction, getRiskLevel } = require('../../services/scoringEngine');
const { createTestDb } = require('../helpers/testDb');
const { buildTransaction, buildHighRiskTransaction, buildLowRiskTransaction } = require('../helpers/fixtures');

describe('scoringEngine', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  test('returns fraud_score, risk_level, and score_breakdown', () => {
    const result = scoreTransaction(buildTransaction(), db);
    expect(result).toHaveProperty('fraud_score');
    expect(result).toHaveProperty('risk_level');
    expect(result).toHaveProperty('score_breakdown');
  });

  test('score_breakdown contains all 7 signals', () => {
    const result = scoreTransaction(buildTransaction(), db);
    expect(result.score_breakdown).toHaveLength(7);
    const signalNames = result.score_breakdown.map((s) => s.signal);
    expect(signalNames).toContain('high_risk_product');
    expect(signalNames).toContain('account_age');
    expect(signalNames).toContain('amount_anomaly');
    expect(signalNames).toContain('geo_mismatch');
    expect(signalNames).toContain('email_velocity');
    expect(signalNames).toContain('card_bin_velocity');
    expect(signalNames).toContain('known_pattern');
  });

  test('each breakdown entry has required shape', () => {
    const result = scoreTransaction(buildTransaction(), db);
    for (const entry of result.score_breakdown) {
      expect(entry).toHaveProperty('score');
      expect(entry).toHaveProperty('signal');
      expect(entry).toHaveProperty('description');
      expect(entry).toHaveProperty('severity');
      expect(typeof entry.score).toBe('number');
    }
  });

  test('scores are additive', () => {
    // buildTransaction: Home Goods(0) + 365 days(0) + $100(0) + all US(0) + no velocity(0)
    const result = scoreTransaction(buildTransaction(), db);
    expect(result.fraud_score).toBe(0);
  });

  test('high-risk transaction scores high', () => {
    // Gift Cards(20) + 0 days(20) + $2000(15) + all different geo(30) + no velocity(0)
    const result = scoreTransaction(buildHighRiskTransaction(), db);
    expect(result.fraud_score).toBe(85);
    expect(result.risk_level).toBe('HIGH');
  });

  test('low-risk transaction scores low', () => {
    const result = scoreTransaction(buildLowRiskTransaction(), db);
    expect(result.fraud_score).toBeLessThanOrEqual(30);
    expect(result.risk_level).toBe('LOW');
  });

  test('fraud_score is capped at 100', () => {
    // Create a scenario that would exceed 100 by adding velocity
    const email = 'spammer@test.com';
    const now = new Date().toISOString();
    for (let i = 0; i < 7; i++) {
      const createdAt = new Date(Date.now() - (i + 1) * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO transactions (id, amount, currency, customer_email,
          billing_country, shipping_country, ip_country, card_bin, card_last4,
          product_category, account_age_days, status, created_at, updated_at)
        VALUES (?, 100, 'USD', ?, 'US', 'US', 'US', '411111', '1234', 'Electronics', 30, 'PENDING', ?, ?)
      `).run(require('crypto').randomUUID(), email, createdAt, createdAt);
    }

    // Gift Cards(20) + 0 days(20) + $2000(15) + all different(30) + email velocity(30) + card bin(15) = 130 -> capped at 100
    const txn = buildHighRiskTransaction({ customer_email: email, card_bin: '411111' });
    const result = scoreTransaction(txn, db);
    expect(result.fraud_score).toBeLessThanOrEqual(100);
  });

  describe('getRiskLevel', () => {
    test('0-30 is LOW', () => {
      expect(getRiskLevel(0)).toBe('LOW');
      expect(getRiskLevel(15)).toBe('LOW');
      expect(getRiskLevel(30)).toBe('LOW');
    });

    test('31-70 is MEDIUM', () => {
      expect(getRiskLevel(31)).toBe('MEDIUM');
      expect(getRiskLevel(50)).toBe('MEDIUM');
      expect(getRiskLevel(70)).toBe('MEDIUM');
    });

    test('71-100 is HIGH', () => {
      expect(getRiskLevel(71)).toBe('HIGH');
      expect(getRiskLevel(85)).toBe('HIGH');
      expect(getRiskLevel(100)).toBe('HIGH');
    });
  });
});
