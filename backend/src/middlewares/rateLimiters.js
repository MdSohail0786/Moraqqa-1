import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  });

export const apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests. Please try again shortly.');
export const authLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts. Please try again in 15 minutes.');
export const enquiryLimiter = make(60 * 60 * 1000, 8, 'Too many submissions. Please try again later.');
export const uploadLimiter = make(15 * 60 * 1000, 200, 'Upload rate limit reached. Please wait a moment.');
