import { calculateExpiry, getTimeUntilExpiry } from '@utils/prompt';

describe('Prompt Utilities', () => {
  describe('calculateExpiry', () => {
    test('returns null for private prompts', () => {
      expect(calculateExpiry(true, false)).toBeNull();
    });

    test('returns null for permanent public prompts', () => {
      expect(calculateExpiry(false, true)).toBeNull();
    });

    test('returns a date 24 hours in the future for normal public prompts', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const expiry = calculateExpiry(false, false);
      expect(expiry.getTime()).toBe(now + 24 * 60 * 60 * 1000);
      
      Date.now.mockRestore();
    });
  });

  describe('getTimeUntilExpiry', () => {
    const mockNow = new Date('2024-01-01T12:00:00Z');

    test('returns null for private or no-expiry prompts', () => {
      expect(getTimeUntilExpiry({ isPrivate: true }, mockNow)).toBeNull();
      expect(getTimeUntilExpiry({ isPrivate: false, expiresAt: null }, mockNow)).toBeNull();
    });

    test('returns "Expired" if current time is past expiry', () => {
      const post = { expiresAt: new Date('2024-01-01T11:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expired');
    });

    test('returns minutes if less than 1 hour remains', () => {
      const post = { expiresAt: new Date('2024-01-01T12:30:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 30m');
    });

    test('returns hours if more than 1 hour remains', () => {
      const post = { expiresAt: new Date('2024-01-01T15:00:00Z') };
      expect(getTimeUntilExpiry(post, mockNow)).toBe('Expires in 3h');
    });
  });
});
