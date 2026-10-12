import { describe, it, expect } from 'vitest';
import { neutralize } from './capacity';
import { tidyPraise } from './praise';

describe('culture guardrails', () => {
  it('replaces judgemental capacity options with neutral ones', () => {
    const out = neutralize({
      options: [
        { kind: 'split', text: 'He is lazy, so split it.' },
        { kind: 'reduce_scope', text: 'Move the deadline by two days.' },
        { kind: 'new_helper', text: 'Find someone less unreliable.' },
      ],
      replyDraft: 'You are weak and uncommitted.',
    }, 'Li Wei');
    const all = JSON.stringify(out);
    expect(all).not.toMatch(/lazy|weak|uncommitted|unreliable/i);
    expect(out.options).toHaveLength(3);
    expect(out.replyDraft).toContain('Li');
    expect(out.options[1].text).toBe('Move the deadline by two days.');
  });

  it('keeps praise short, specific and calm', () => {
    const t = tidyPraise('Amazing job!!! You closed the review and unblocked the next step and also kept going for a very long time without stopping at all today');
    expect(t).not.toContain('!');
    expect(t.split(/\s+/).length).toBeLessThanOrEqual(20);
  });
});
