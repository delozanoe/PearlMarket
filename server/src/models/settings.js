function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = parseFloat(row.value);
  }
  return settings;
}

function updateSettings(db, updates) {
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
  );

  const updateAll = db.transaction(() => {
    if (updates.auto_approve_below !== undefined) {
      const val = String(updates.auto_approve_below);
      upsert.run('auto_approve_below', val, val);
    }
    if (updates.auto_block_above !== undefined) {
      const val = String(updates.auto_block_above);
      upsert.run('auto_block_above', val, val);
    }
  });

  updateAll();
  return getSettings(db);
}

module.exports = { getSettings, updateSettings };
