import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Bearer header only. Cookies are deliberately not accepted for auth, which rules out CSRF.
const extractToken = (req) => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
};

async function resolveUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  const payload = jwt.verify(token, env.jwtSecret);
  return User.findById(payload.id);
}

/** Requires a valid token. */
export const protect = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req).catch(() => null);
  if (!user) throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  req.user = user;
  next();
});

/** Attaches req.user when a valid token is present, but never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = (await resolveUser(req).catch(() => null)) || undefined;
  next();
});

export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
