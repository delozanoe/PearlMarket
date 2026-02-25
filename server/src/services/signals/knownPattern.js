const { getBlockCount } = require('../../models/blockedEntity');

module.exports = {
  name: 'known_pattern',
  calculate(transaction, db) {
    const emailBlocks = getBlockCount(db, 'email', transaction.customer_email);
    const binBlocks = getBlockCount(db, 'card_bin', transaction.card_bin);
    const maxBlocks = Math.max(emailBlocks, binBlocks);

    let score = 0;
    if (maxBlocks >= 3) score = 40;

    let severity = 'none';
    if (score >= 40) severity = 'high';

    return {
      score,
      signal: 'known_pattern',
      description: score > 0
        ? `Entity has ${maxBlocks} prior blocks (email: ${emailBlocks}, card BIN: ${binBlocks})`
        : 'No known fraud patterns',
      severity,
    };
  },
};
