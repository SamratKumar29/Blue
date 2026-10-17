import { Router } from 'express';
import { cloudConfigured, getModelName } from '../gemini';

export const health = Router();

health.get('/health', (_req, res) => {
  res.json({ ok: true });
});

health.get('/config', (_req, res) => {
  res.json({ cloudAvailable: cloudConfigured(), model: getModelName() });
});
