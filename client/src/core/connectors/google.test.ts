import { describe, it, expect } from 'vitest';
import { looksLikeOtp, maskCodes } from './google';

describe('OTP masking', () => {
  it('detects verification mail and masks codes', () => {
    expect(looksLikeOtp('Your verification code', 'Use 482913 to sign in')).toBe(true);
    expect(maskCodes('Use 482913 to sign in')).not.toContain('482913');
    expect(maskCodes('Code: 123-456 or G-778812')).not.toMatch(/123|456|778812/);
  });
  it('leaves ordinary mail alone', () => {
    expect(looksLikeOtp('Sprint demo on Friday', 'Room 4021 at 3pm')).toBe(false);
  });
});
