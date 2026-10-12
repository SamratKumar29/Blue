import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'blue-server', timestamp: new Date().toISOString() });
});

// Serve client in production if built
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Blue server is running (API mode). Client build not found in public/.');
    }
  });
});

app.listen(port, () => {
  console.log(`Blue server listening on port ${port}`);
});
