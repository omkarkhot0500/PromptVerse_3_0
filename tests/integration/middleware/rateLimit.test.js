/**
 * @jest-environment node
 */

// ============================================================
// PURPOSE: Test the Rate Limiting Middleware
// The middleware uses a "token bucket" algorithm:
// - Each user has a bucket with limited tokens
// - Each request uses 1 token
// - Tokens refill over time
// - If the bucket is empty → request is BLOCKED (429 Too Many Requests)
// - If Redis is down → requests are ALLOWED (fail-soft)
// ============================================================

// Mock Redis — so we can control what the middleware reads/writes
jest.mock('@utils/redis');

// Mock next-auth/jwt — so the middleware doesn't try to verify real auth tokens
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn().mockResolvedValue(null), // pretend: no user is logged in
}));

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Check: First request from a new user should be ALLOWED
  // (bucket starts full, so there are tokens available)
  test('allows request when tokens are available (first request)', async () => {
    const redis = (await import('@utils/redis')).default;

    // No existing record in Redis = first request ever
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');

    const { middleware } = await import('../../../middleware');

    const req = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
    });
    // Middleware needs nextUrl to check the route
    req.nextUrl = new URL('http://localhost:3000/api/prompt/new');
    req.ip = '127.0.0.1';

    const response = await middleware(req);

    // Should NOT return 429 (should be allowed through)
    expect(response.status).not.toBe(429);
    // Should save the updated token count to Redis
    expect(redis.set).toHaveBeenCalled();
  });

  // Check: If the user's bucket is EMPTY (0 tokens left),
  // the request should be BLOCKED with a 429 status
  test('blocks request when rate limit is exceeded (429)', async () => {
    const redis = (await import('@utils/redis')).default;

    // Bucket has 0 tokens and was just accessed (no time to refill)
    redis.get.mockResolvedValue({ tokens: 0, lastTime: Date.now() / 1000 });
    redis.set.mockResolvedValue('OK');

    const { middleware } = await import('../../../middleware');

    const req = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
    });
    req.nextUrl = new URL('http://localhost:3000/api/prompt/new');
    req.ip = '127.0.0.1';

    const response = await middleware(req);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Too Many Requests');
    expect(body.message).toContain('Rate limit exceeded');
  });

  // Check: When a request is blocked, the response should include
  // a "Retry-After" header telling the client how long to wait
  test('includes Retry-After header when rate limited', async () => {
    const redis = (await import('@utils/redis')).default;

    redis.get.mockResolvedValue({ tokens: 0, lastTime: Date.now() / 1000 });
    redis.set.mockResolvedValue('OK');

    const { middleware } = await import('../../../middleware');

    const req = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
    });
    req.nextUrl = new URL('http://localhost:3000/api/prompt/new');
    req.ip = '127.0.0.1';

    const response = await middleware(req);

    // Response should have a Retry-After header
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  // Check: Routes that are NOT in the rate limit config (like GET /api/prompt)
  // should pass through without any rate limiting
  test('skips rate limiting for non-configured routes', async () => {
    const redis = (await import('@utils/redis')).default;

    const { middleware } = await import('../../../middleware');

    const req = new Request('http://localhost:3000/api/prompt', {
      method: 'GET',
    });
    req.nextUrl = new URL('http://localhost:3000/api/prompt');
    req.ip = '127.0.0.1';

    const response = await middleware(req);

    // Should pass through (not blocked)
    expect(response.status).not.toBe(429);
    // Redis should NOT even be called (route is not rate-limited)
    expect(redis.get).not.toHaveBeenCalled();
  });

  // Check: If Redis is DOWN (connection error), the middleware should
  // FAIL SOFT — meaning it allows the request through instead of crashing
  // This prevents Redis downtime from breaking the entire app
  test('fails soft when Redis is down (allows request through)', async () => {
    const redis = (await import('@utils/redis')).default;

    // Simulate Redis crash
    redis.get.mockRejectedValue(new Error('Redis connection refused'));

    const { middleware } = await import('../../../middleware');

    const req = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
    });
    req.nextUrl = new URL('http://localhost:3000/api/prompt/new');
    req.ip = '127.0.0.1';

    const response = await middleware(req);

    // Should allow the request (not 429) even though Redis failed
    expect(response.status).not.toBe(429);
  });
});
