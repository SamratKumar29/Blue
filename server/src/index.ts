import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { health } from './routes/health.js';
import { ai } from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '200kb' }));

  // Log method, path, status and duration only. Never bodies.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${Date.now() - start}ms`));
    next();
  });

  app.use('/api', health);
  app.use('/api/ai', ai);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));
  app.use((req, res) => {
    if (req.method !== 'GET') {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) res.status(404).send('Blue API is running. Client build not found.');
    });
  });

  // Body parse errors etc.: no content in the response.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
    res.status(status).json({ error: status === 413 ? 'Request is too large.' : 'Bad request.' });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  createApp().listen(port, () => console.log(`Blue server listening on port ${port}`));
}
