const createApp = require('./app');
const { getDb } = require('./config/database');

const PORT = process.env.PORT || 3001;
const db = getDb();
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
