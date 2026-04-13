import { NextResponse } from 'next/server';

// In-memory rate limit store: Map<string, { count: number, resetTime: number }>
const rateLimitStore = new Map();

const AI_ROUTES = ['/api/ai-mark', '/api/ai-mark-batch'];
const AI_RATE_LIMIT = 10;       // requests per window
const GENERAL_RATE_LIMIT = 60;  // requests per window
const WINDOW_MS = 60 * 1000;    // 1 minute

function getRateLimitKey(ip, isAiRoute) {
  return `${ip}:${isAiRoute ? 'ai' : 'general'}`;
}

function checkRateLimit(key, limit) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// Periodic cleanup of expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const isAiRoute = AI_ROUTES.some(route => pathname.startsWith(route));
  const limit = isAiRoute ? AI_RATE_LIMIT : GENERAL_RATE_LIMIT;
  const key = getRateLimitKey(ip, isAiRoute);

  const result = checkRateLimit(key, limit);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
