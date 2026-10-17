import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { health } from './server/routes/health';
import { ai } from './server/routes/ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '200kb' }));

  // Log method, path, status and duration
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () =>
      console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`)
    );
    next();
  });

  // API Routes
  app.use('/api', health);
  app.use('/api/ai', ai);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // In production, serve dist folder; in dev, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      if (req.method !== 'GET') {
        res.status(404).end();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
    res.status(status).json({ error: status === 413 ? 'Request is too large.' : 'Bad request.' });
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Blue server listening on port ${port}`);
  });

  return app;
}

createServer();
