import type { Request, Response, NextFunction } from 'express';

export const MAX_CHARS = 30_000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

/** Simple in-memory limiter: 30 requests per minute per client IP. */
export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    return;
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}

export function resetRateLimit() {
  hits.clear();
}

// Defense in depth: the client filters first; the server refuses obvious repo/secret content.
const BLOCKED_MARKERS: RegExp[] = [
  /diff --git/,
  /^@@ -\d+/m,
  /-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)?/,
  /\bghp_[A-Za-z0-9]{6,}/,
  /\bsk_[A-Za-z0-9_]{6,}/,
  /\bAKIA[0-9A-Z]{8,}/,
];

export function violatesPrivacyRules(text: string): boolean {
  return BLOCKED_MARKERS.some((re) => re.test(text));
}
