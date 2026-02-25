const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');

describe('Settings API', () => {
  let app, db;

  beforeEach(() => { ({ app, db } = createTestApp()); });
  afterEach(() => { db.close(); });

  describe('GET /api/settings', () => {
    test('returns default settings', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.status).toBe(200);
      expect(res.body.auto_approve_below).toBe(20);
      expect(res.body.auto_block_above).toBe(80);
    });
  });

  describe('PUT /api/settings', () => {
    test('updates auto_approve_below', async () => {
      const res = await request(app).put('/api/settings').send({ auto_approve_below: 10 });
      expect(res.status).toBe(200);
      expect(res.body.auto_approve_below).toBe(10);
      expect(res.body.auto_block_above).toBe(80);
    });

    test('updates auto_block_above', async () => {
      const res = await request(app).put('/api/settings').send({ auto_block_above: 90 });
      expect(res.status).toBe(200);
      expect(res.body.auto_block_above).toBe(90);
    });

    test('updates both settings', async () => {
      const res = await request(app).put('/api/settings').send({
        auto_approve_below: 15,
        auto_block_above: 85,
      });
      expect(res.body.auto_approve_below).toBe(15);
      expect(res.body.auto_block_above).toBe(85);
    });

    test('rejects invalid values', async () => {
      const res = await request(app).put('/api/settings').send({ auto_approve_below: -1 });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    test('rejects values over 100', async () => {
      const res = await request(app).put('/api/settings').send({ auto_block_above: 101 });
      expect(res.status).toBe(400);
    });

    test('persists changes', async () => {
      await request(app).put('/api/settings').send({ auto_approve_below: 5 });
      const res = await request(app).get('/api/settings');
      expect(res.body.auto_approve_below).toBe(5);
    });
  });
});
