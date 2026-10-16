import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/** Runs after express-validator chains and rejects with a 400 listing every problem. */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest(details[0].message, details));
};
