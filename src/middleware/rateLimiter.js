const config = require('../config');

// Simple in-memory rate limiter
// Note: For production, use Redis or a distributed cache
const requestCounts = new Map();

function rateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests;

  // Clean up old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.windowStart > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, 60000);

  return (req, res, next) => {
    // Use IP address as identifier
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = requestCounts.get(clientId);

    if (!clientData || now - clientData.windowStart > windowMs) {
      // Start new window
      clientData = {
        windowStart: now,
        count: 1
      };
      requestCounts.set(clientId, clientData);
    } else {
      clientData.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + windowMs) / 1000));

    if (clientData.count > maxRequests) {
      const retryAfter = Math.ceil((clientData.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

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
