import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import redis from './utils/redis';

// Configuration as per business requirements
const CONFIG = {
  '/api/prompt/new': { bucketSize: 10, refillRate: 1 }, // 10 burst, 1 per second
  '/api/auth/signin': { bucketSize: 5, refillRate: 5 / 60 }, // 5 per minute
  '/api/auth/signup': { bucketSize: 5, refillRate: 5 / 60 }, // 5 per minute
};

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // Find matching config for the current route
  const routeConfig = CONFIG[pathname] || Object.entries(CONFIG).find(([path]) => pathname.startsWith(path))?.[1];

  // If route is not meant to be rate limited, skip
  if (!routeConfig) {
    return NextResponse.next();
  }

  const { bucketSize, refillRate } = routeConfig;

  try {
    // 1. Identify the user (UserId if logged in, otherwise IP)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
    const identifier = token?.email || token?.sub || ip;

    // Create a unique key for this user and route
    const key = `rate_limit:${identifier}:${pathname}`;

    // 2. Get data from Redis
    const data = await redis.get(key);
    const now = Date.now() / 1000; // Current time in seconds

    let tokens;
    let lastTime;

    if (data && typeof data === 'object') {
      tokens = data.tokens;
      lastTime = data.lastTime;
    } else {
      // Case A — First time user or expired record
      tokens = bucketSize;
      lastTime = now;
    }

    // 3. Calculate refill (Token Bucket Logic)
    const timePassed = now - lastTime;
    const tokensToAdd = timePassed * refillRate;

    tokens = Math.min(bucketSize, tokens + tokensToAdd);

    // 4. Decide allow or reject
    if (tokens >= 1) {
      // ✅ ALLOW request
      tokens = tokens - 1;

      // 5. Save back to Redis
      // Set 1-hour expiration to keep Redis clean
      await redis.set(key, { tokens, lastTime: now }, { ex: 3600 });

      const response = NextResponse.next();  // The bouncer at the door says you're good. Go ahead!

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', bucketSize.toString());
      response.headers.set('X-RateLimit-Remaining', Math.floor(tokens).toString());

      return response;
    } else {
      // ❌ REJECT request
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please wait a moment.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((1 - tokens) / refillRate).toString()
          }
        }
      );
    }
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // Fail-soft: if Redis is down, allow the request
    return NextResponse.next();
  }
}

// Optimization: Only run middleware on targeted routes
export const config = {
  matcher: [
    '/api/prompt/new',
    '/api/auth/:path*'
  ],
};
