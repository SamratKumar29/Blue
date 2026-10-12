import { Router } from 'express';
import { cloudConfigured } from '../gemini.js';

export const health = Router();

health.get('/health', (_req, res) => {
  res.json({ ok: true });
});

health.get('/config', (_req, res) => {
  res.json({ cloudAvailable: cloudConfigured(), model: process.env.GEMINI_MODEL ?? null });
});
