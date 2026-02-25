const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');

// GET /api/settings
router.get('/', (req, res, next) => {
  try {
    const settings = Settings.getSettings(req.db);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put('/', (req, res, next) => {
  try {
    const { auto_approve_below, auto_block_above } = req.body;
    const errors = [];

    if (auto_approve_below !== undefined) {
      if (typeof auto_approve_below !== 'number' || auto_approve_below < 0 || auto_approve_below > 100) {
        errors.push('auto_approve_below must be a number between 0 and 100');
      }
    }

    if (auto_block_above !== undefined) {
      if (typeof auto_block_above !== 'number' || auto_block_above < 0 || auto_block_above > 100) {
        errors.push('auto_block_above must be a number between 0 and 100');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const settings = Settings.updateSettings(req.db, req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
