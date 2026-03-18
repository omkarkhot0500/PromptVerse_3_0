import { calculateExpiry, getTimeUntilExpiry } from '@utils/prompt';

// ============================================================
// PURPOSE: Test the utility functions that handle prompt expiry
// - calculateExpiry: decides WHEN a prompt should expire
// - getTimeUntilExpiry: shows HOW MUCH TIME is left before expiry
// ============================================================

describe('Prompt Utilities', () => {
  describe('calculateExpiry', () => {

    // If a prompt is private, it should NEVER expire (null = no expiry)
    test('returns null for private prompts', () => {
      expect(calculateExpiry(true, false)).toBeNull();
    });

    // If a prompt is marked as permanent, it should NEVER expire
    test('returns null for permanent public prompts', () => {
      expect(calculateExpiry(false, true)).toBeNull();
    });

    // If a prompt is both private AND permanent, still no expiry
    test('returns null when both private and permanent', () => {
      expect(calculateExpiry(true, true)).toBeNull();
    });

    // A normal public prompt (not permanent) should expire exactly 24 hours from now
    test('returns a date 24 hours in the future for normal public prompts', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const expiry = calculateExpiry(false, false);
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBe(now + 24 * 60 * 60 * 1000);
      
      Date.now.mockRestore();
    });

    // Make sure the function actually returns a valid Date (not null/undefined)
    test('returns a valid Date object (not null or undefined)', () => {
      const expiry = calculateExpiry(false, false);
      expect(expiry).toBeTruthy();
      expect(expiry).toBeInstanceOf(Date);
    });
  });

  describe('getTimeUntilExpiry', () => {
    // We use a fixed "now" time so tests don't depend on real clock
    const mockNow = new Date('2024-01-01T12:00:00Z');

    // Private prompts should never show any expiry info
    test('returns null for private prompts', () => {
      expect(getTimeUntilExpiry({ isPrivate: true, expiresAt: new Date() }, mockNow)).toBeNull();
    });

    // If expiresAt is null (permanent prompt), no expiry info to show
    test('returns null when expiresAt is null', () => {
      expect(getTimeUntilExpiry({ isPrivate: false, expiresAt: null }, mockNow)).toBeNull();
    });

    // Edge case: if expiresAt field doesn't exist at all, treat as no expiry
    test('returns null when expiresAt is undefined', () => {
      expect(getTimeUntilExpiry({ isPrivate: false }, mockNow)).toBeNull();
    });

    // If the expiry time is in the past, show "Expired"
    test('returns "Expired" if current time is past expiry', () => {
      const post = { expiresAt: new Date('2024-01-01T11:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expired');
    });

    // Edge case: expiry is just 1 millisecond in the past — should still say "Expired"
    test('returns "Expired" if expiry is just 1ms in the past', () => {
      const post = { expiresAt: new Date('2024-01-01T11:59:59.999Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expired');
    });

    // If 30 minutes are left, show "Expires in 30m"
    test('returns minutes if less than 1 hour remains', () => {
      const post = { expiresAt: new Date('2024-01-01T12:30:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 30m');
    });

    // Edge case: exactly 0 minutes left (expiry is right now)
    test('returns "Expires in 0m" at exact 0 minutes remaining', () => {
      const post = { expiresAt: new Date('2024-01-01T12:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 0m');
    });

    // If 3 hours are left, show "Expires in 3h"
    test('returns hours if more than 1 hour remains', () => {
      const post = { expiresAt: new Date('2024-01-01T15:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 3h');
    });

    // Edge case: exactly 1 hour left — should say "Expires in 1h" (not minutes)
    test('returns "Expires in 1h" at exactly 1 hour remaining', () => {
      const post = { expiresAt: new Date('2024-01-01T13:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 1h');
    });

    // If more than 24 hours remain, we don't show any expiry info (null)
    test('returns null if more than 24 hours remain', () => {
      const post = { expiresAt: new Date('2024-01-03T12:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBeNull();
    });

    // Edge case: exactly 23 hours left — still within 24h, so show "Expires in 23h"
    test('returns "Expires in 23h" at exactly 23 hours remaining', () => {
      const post = { expiresAt: new Date('2024-01-02T11:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 23h');
    });
  });
});
