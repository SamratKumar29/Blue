import { describe, it, expect } from 'vitest';
import { isCodebaseContent, redactSecrets, isSafeOutput, containsSecret } from './filters';
import messages from '../../data/messages.json';

describe('privacy filters', () => {
  it('flags PR links and diffs as codebase content', () => {
    expect(isCodebaseContent('see https://github.com/acme/atlas/pull/482/files')).toBe(true);
    expect(isCodebaseContent('diff --git a/x b/x')).toBe(true);
    expect(isCodebaseContent('line\n@@ -42,6 +42,8 @@ const x')).toBe(true);
    expect(isCodebaseContent('Design review at 11, please look at the Figma file')).toBe(false);
  });

  it('redacts secrets', () => {
    const out = redactSecrets('I put API_KEY=sk_demo_1234567890abcdef in the config');
    expect(out).not.toContain('sk_demo_');
    expect(out).toContain('[REDACTED]');
    expect(redactSecrets('token ghp_abcdefghijklmnop here')).not.toContain('ghp_abc');
    expect(containsSecret('AKIAABCDEFGH12345678')).toBe(true);
  });

  it('sample messages: only intended items are excluded or redacted', () => {
    const excluded = messages.filter((m) => isCodebaseContent(m.text)).map((m) => m.id);
    const secret = messages.filter((m) => containsSecret(m.text)).map((m) => m.id);
    expect(excluded).toEqual(['msg_006']);
    expect(secret).toContain('msg_005');
    expect(isSafeOutput('Rotate the sandbox credential')).toBe(true);
    expect(isSafeOutput('use sk_demo_1234567890abcdef')).toBe(false);
  });
});
