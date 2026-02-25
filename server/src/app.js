const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
