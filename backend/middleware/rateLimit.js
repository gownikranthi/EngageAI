const rateLimit = require('express-rate-limit');

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Moderate limiter for events: 50 requests per 10 minutes per IP
const eventLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  message: {
    success: false,
    message: 'Too many event requests from this IP, please try again later.'
  }
});

// Stricter limiter for admin or sensitive endpoints: 10 requests per 10 minutes per IP
const sensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many sensitive actions from this IP, please try again later.'
  }
});

module.exports = { generalLimiter, eventLimiter, sensitiveLimiter }; 