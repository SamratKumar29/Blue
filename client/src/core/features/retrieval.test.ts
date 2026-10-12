import { describe, it, expect } from 'vitest';
import { retrieve, DOC_NAMES } from './retrieval';

describe('policy retrieval', () => {
  it('ranks the incident-escalation chunk first for an escalation question', () => {
    const hits = retrieve('who do I escalate a production incident to');
    expect(hits[0].doc).toBe('incident-escalation');
  });
  it('knows the approved documents', () => {
    expect(DOC_NAMES()).toEqual(expect.arrayContaining(['incident-escalation', 'leave-and-hours', 'code-review-norms', 'project_brief']));
  });
  it('returns nothing for gibberish', () => {
    expect(retrieve('zzzz qqqq')).toEqual([]);
  });
});
