import { Router } from 'express';
import { complete } from '../gemini.js';
import { MAX_CHARS, rateLimit, violatesPrivacyRules } from '../limits.js';

export const ai = Router();

ai.post('/complete', rateLimit, async (req, res) => {
  const { system, prompt, jsonSchema } = req.body ?? {};
  if (typeof system !== 'string' || typeof prompt !== 'string') {
    res.status(400).json({ error: 'system and prompt must be strings.' });
    return;
  }
  if (jsonSchema !== undefined && (typeof jsonSchema !== 'object' || jsonSchema === null)) {
    res.status(400).json({ error: 'jsonSchema must be an object.' });
    return;
  }
  if (system.length + prompt.length > MAX_CHARS) {
    res.status(413).json({ error: 'Request is too large.' });
    return;
  }
  if (violatesPrivacyRules(system) || violatesPrivacyRules(prompt)) {
    res.status(422).json({ error: 'Content excluded by privacy rules.' });
    return;
  }
  try {
    res.json(await complete({ system, prompt, jsonSchema }));
  } catch (err) {
    // Never echo request content; log only the error class.
    console.error('ai.complete failed:', err instanceof Error ? err.name : 'unknown');
    res.status(502).json({ error: 'The AI service is unavailable right now.' });
  }
});
