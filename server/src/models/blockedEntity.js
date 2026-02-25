function recordBlock(db, email, cardBin) {
  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO blocked_entities (entity_type, entity_value, block_count, created_at, updated_at)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(entity_type, entity_value)
    DO UPDATE SET block_count = block_count + 1, updated_at = ?
  `);

  const recordBlockTransaction = db.transaction(() => {
    if (email) upsert.run('email', email, now, now, now);
    if (cardBin) upsert.run('card_bin', cardBin, now, now, now);
  });

  recordBlockTransaction();
}

function getBlockCount(db, entityType, entityValue) {
  const row = db.prepare(
    'SELECT block_count FROM blocked_entities WHERE entity_type = ? AND entity_value = ?'
  ).get(entityType, entityValue);
  return row ? row.block_count : 0;
}

module.exports = { recordBlock, getBlockCount };
