// Deterministic privacy filters. They run BEFORE any text reaches a model and again on model output.

const CODEBASE_PATTERNS: RegExp[] = [
  /github\.com\/[^\s/]+\/[^\s/]+\/(pull|pulls|commit|commits|blob|tree|compare)\b/i,
  /gitlab\.com\/[^\s]+\/(merge_requests|commit|blob)\b/i,
  /bitbucket\.org\/[^\s]+\/(pull-requests|commits|src)\b/i,
  /diff --git/,
  /^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/m,
  /^\+\+\+ \S+/m,
  /^--- \S+/m,
  /\bat [\w$.]+\([\w$.]+\.(java|kt|py|js|ts|go|rb|cs):\d+\)/,
  /Traceback \(most recent call last\)/,
  /(^|\s)\.env(\.\w+)?\b/,
];

const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|ghp|gho|ghu|AKIA|xox[abp])[A-Za-z0-9_-]{8,}\b/g,
  /\b(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD)\s*[=:]\s*\S+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
];

export function isCodebaseContent(text: string): boolean {
  return CODEBASE_PATTERNS.some((re) => re.test(text));
}

export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((t, re) => t.replace(re, (m) => (/^(API|SECRET|TOKEN|PASSW)/i.test(m) ? m.replace(/([=:]\s*)\S+$/, '$1[REDACTED]') : '[REDACTED]')), text);
}

export function containsSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

/** Model output must satisfy the same rules as input. */
export function isSafeOutput(text: string): boolean {
  return !isCodebaseContent(text) && !containsSecret(text);
}

export function cleanOutput(text: string): string {
  return redactSecrets(text).replace(/https?:\/\/\S+/g, '[link removed]').trim();
}
