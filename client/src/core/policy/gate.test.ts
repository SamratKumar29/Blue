import { describe, it, expect } from 'vitest';
import { decide, hashAction, verifyApproval, type ActionRequest, type ActionType } from './gate';
import type { Settings } from '../types';

const base: Settings = {
  name: 'Alex', timezone: 'Asia/Kolkata', language: 'en', presence: 'work_hours',
  workStart: '09:30', workEnd: '18:00', waterReminderMin: 90,
  allowWriting: false, allowConnectors: false, allowTeamContext: false,
  modelMode: 'cloud', cloudConsentGiven: false, praise: true, checkins: true,
  toneObservations: true, paused: false, retentionDays: 30,
};
const allOn: Settings = { ...base, allowWriting: true, allowConnectors: true, allowTeamContext: true, cloudConsentGiven: true };
const ALL: ActionType[] = ['read_source', 'draft_local', 'send_message', 'create_event', 'edit_record', 'delete_record', 'cloud_inference', 'blue_to_blue', 'screen_capture', 'read_codebase'];

describe('policy gate', () => {
  it('always denies codebase reads', async () => {
    for (const s of [base, allOn]) {
      const d = await decide({ type: 'read_codebase' }, s);
      expect(d).toEqual({ result: 'deny', reason: 'Codebase access is never permitted.' });
    }
  });

  it('denies blue_to_blue and screen_capture even with everything on', async () => {
    expect((await decide({ type: 'blue_to_blue' }, allOn)).result).toBe('deny');
    expect((await decide({ type: 'screen_capture' }, allOn)).result).toBe('deny');
  });

  it('denies send when writing is off, needs approval when on', async () => {
    const req: ActionRequest = { type: 'send_message', recipient: 'Priya', content: 'Hello', effect: 'Send message' };
    expect(await decide(req, base)).toEqual({ result: 'deny', reason: 'Write actions are off.' });
    const d = await decide(req, { ...base, allowWriting: true });
    expect(d.result).toBe('needs_approval');
    if (d.result === 'needs_approval') expect(d.previewHash).toBe(await hashAction(req));
  });

  it('invalidates approval when content changes by one character', async () => {
    const req: ActionRequest = { type: 'send_message', recipient: 'Priya', content: 'Hello', effect: 'Send message' };
    const h = await hashAction(req);
    expect(await verifyApproval(req, h)).toBe(true);
    expect(await verifyApproval({ ...req, content: 'Hellp' }, h)).toBe(false);
    expect(await verifyApproval({ ...req, recipient: 'Amir' }, h)).toBe(false);
  });

  it('read_source follows allowConnectors', async () => {
    expect((await decide({ type: 'read_source', source: 'demo-slack' }, base)).result).toBe('deny');
    expect((await decide({ type: 'read_source', source: 'demo-slack' }, { ...base, allowConnectors: true })).result).toBe('allow');
  });

  it('cloud_inference needs approval until consent is recorded', async () => {
    expect((await decide({ type: 'cloud_inference' }, base)).result).toBe('needs_approval');
    expect((await decide({ type: 'cloud_inference' }, { ...base, cloudConsentGiven: true })).result).toBe('allow');
  });

  it('paused denies every action, including draft_local', async () => {
    const paused = { ...allOn, paused: true };
    for (const type of ALL) {
      const d = await decide({ type }, paused);
      expect(d.result).toBe('deny');
    }
    expect(await decide({ type: 'draft_local' }, paused)).toEqual({ result: 'deny', reason: 'Blue is paused.' });
    expect(await decide({ type: 'read_codebase' }, paused)).toEqual({ result: 'deny', reason: 'Codebase access is never permitted.' });
  });

  it('draft_local is allowed when not paused', async () => {
    expect((await decide({ type: 'draft_local' }, base)).result).toBe('allow');
  });
});
