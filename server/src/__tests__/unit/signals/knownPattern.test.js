const signal = require('../../../services/signals/knownPattern');
const { recordBlock } = require('../../../models/blockedEntity');
const { createTestDb } = require('../../helpers/testDb');
const { buildTransaction } = require('../../helpers/fixtures');

describe('knownPattern signal', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  test('name is known_pattern', () => {
    expect(signal.name).toBe('known_pattern');
  });

  test('scores 0 with no prior blocks', () => {
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('scores 0 with 1-2 blocks', () => {
    recordBlock(db, 'customer@example.com', '411111');
    recordBlock(db, 'customer@example.com', '411111');
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(0);
  });

  test('scores 40 with 3+ blocks on email', () => {
    for (let i = 0; i < 3; i++) {
      recordBlock(db, 'customer@example.com', '999999');
    }
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(40);
    expect(result.severity).toBe('high');
  });

  test('scores 40 with 3+ blocks on card_bin', () => {
    for (let i = 0; i < 3; i++) {
      recordBlock(db, 'other@example.com', '411111');
    }
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(40);
    expect(result.severity).toBe('high');
  });

  test('uses max of email and card_bin blocks', () => {
    for (let i = 0; i < 3; i++) {
      recordBlock(db, 'customer@example.com', '999999');
    }
    recordBlock(db, 'other@example.com', '411111');
    const result = signal.calculate(buildTransaction(), db);
    expect(result.score).toBe(40);
  });
});
