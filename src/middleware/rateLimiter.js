const config = require('../config');

// Simple in-memory rate limiter
// Note: For production, use Redis or a distributed cache
// IMPORTANT: Ensure Express is configured with `app.set('trust proxy', true)` when behind a proxy
// to prevent IP spoofing via X-Forwarded-For headers
const requestCounts = new Map();

// Global cleanup interval - runs once regardless of how many rate limiters are created
let cleanupInterval = null;
function startCleanup(windowMs) {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.windowStart > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, 60000);
}

function rateLimiter(options = {}) {
  // Validate input parameters
  if (options.windowMs !== undefined && (typeof options.windowMs !== 'number' || options.windowMs <= 0)) {
    throw new TypeError('windowMs must be a positive number');
  }
  if (options.maxRequests !== undefined && (typeof options.maxRequests !== 'number' || options.maxRequests <= 0)) {
    throw new TypeError('maxRequests must be a positive number');
  }

  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests;

  // Start cleanup with the configured window
  startCleanup(windowMs);

  return (req, res, next) => {
    // Use IP address as identifier
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = requestCounts.get(clientId);

    if (!clientData || now - clientData.windowStart > windowMs) {
      // Start new window with count 0 (will be incremented below)
      clientData = {
        windowStart: now,
        count: 0
      };
      requestCounts.set(clientId, clientData);
    }

    // Check limit BEFORE incrementing to ensure rejected requests aren't counted
    if (clientData.count >= maxRequests) {
      const retryAfter = Math.ceil((clientData.windowStart + windowMs - now) / 1000);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + windowMs) / 1000));
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    // Increment count only for allowed requests
    clientData.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + windowMs) / 1000));

    next();
  };
}

// Stricter rate limiter for sensitive endpoints
function strictRateLimiter() {
  return rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  });
}

module.exports = { rateLimiter, strictRateLimiter };
