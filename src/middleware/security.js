const config = require('../config');

// Security headers middleware
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
}

// Request body size limiter
function bodySizeLimiter(maxSize = '100kb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds maximum size of ${maxSize}`
      });
    }

    next();
  };
}

// Parse size string to bytes (e.g., '100kb' -> 102400)
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 102400; // Default 100kb

  const num = parseInt(match[1], 10);
  const unit = match[2] || 'b';

  return num * units[unit];
}

// SQL injection pattern detector (for logging/alerting)
function sqlInjectionDetector(req, res, next) {
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];

  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  // Check query params, body, and params
  if (checkObject(req.query) || checkObject(req.body) || checkObject(req.params)) {
    console.warn(`[SECURITY] Potential SQL injection attempt from ${req.ip}: ${req.originalUrl}`);
    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Request contains invalid characters'
    });
  }

  next();
}

// NoSQL injection pattern detector
function noSqlInjectionDetector(req, res, next) {
  const checkValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      // Check for MongoDB operators
      const keys = Object.keys(value);
      return keys.some(key => key.startsWith('$'));
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkObject(req.body)) {
    console.warn(`[SECURITY] Potential NoSQL injection attempt from ${req.ip}: ${req.originalUrl}`);
    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Request contains invalid operators'
    });
  }

  next();
}

module.exports = {
  securityHeaders,
  bodySizeLimiter,
  sqlInjectionDetector,
  noSqlInjectionDetector
};
