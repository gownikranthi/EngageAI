const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const express = require('express');

// Combine both sanitizers into one middleware
const sanitizeMiddleware = express.Router();
sanitizeMiddleware.use(mongoSanitize());
sanitizeMiddleware.use(xss());

module.exports = sanitizeMiddleware; 