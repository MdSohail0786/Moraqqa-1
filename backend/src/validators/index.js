import { body, param } from 'express-validator';
import { BUDGETS, ENQUIRY_STATUSES, PROJECT_TYPES } from '../models/Enquiry.js';

export const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().isLength({ min: 1, max: 200 }).withMessage('Password is required'),
];

export const passwordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 10, max: 128 })
    .withMessage('New password must be at least 10 characters'),
];

export const enquiryRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your name'),
  body('email').trim().isEmail().withMessage('Please enter a valid email').isLength({ max: 160 }),
  body('phone')
    .trim()
    .matches(/^[+()\-\d\s]{7,20}$/)
    .withMessage('Please enter a valid phone number'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  body('projectType').isIn(PROJECT_TYPES).withMessage('Please choose a project type'),
  body('budget').isIn(BUDGETS).withMessage('Please choose a budget range'),
  body('area').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Please tell us a little more (at least 10 characters)'),
];

export const enquiryUpdateRules = [
  param('id').isMongoId().withMessage('Invalid enquiry id'),
  body('status').optional().isIn(ENQUIRY_STATUSES).withMessage('Invalid status'),
  body('read').optional().isBoolean().withMessage('read must be true or false'),
  body('notes').optional().isString().isLength({ max: 3000 }),
];

export const newsletterRules = [body('email').trim().isEmail().withMessage('Please enter a valid email').isLength({ max: 160 })];

export const idRule = [param('id').isMongoId().withMessage('Invalid id')];

export const projectRules = [
  body('title').optional().trim().isLength({ min: 2, max: 140 }).withMessage('Title must be 2–140 characters'),
  body('year').optional({ values: 'falsy' }).isInt({ min: 1900, max: 2100 }).withMessage('Enter a valid year'),
  body('projectType').optional().isIn(PROJECT_TYPES).withMessage('Invalid project type'),
  body('category').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid category'),
  body('status').optional().isIn(['Completed', 'In Progress', 'Concept']),
  body('featured').optional().isBoolean(),
  body('published').optional().isBoolean(),
];
export const projectCreateRules = [body('title').trim().notEmpty().withMessage('Title is required'), ...projectRules];

export const categoryRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('group').optional().isIn(['type', 'style', 'room']).withMessage('Invalid group'),
];
export const categoryCreateRules = [body('name').trim().notEmpty().withMessage('Name is required'), ...categoryRules];

export const titleRules = [body('title').optional().trim().isLength({ min: 2, max: 180 }).withMessage('Title must be 2–180 characters')];
export const titleCreateRules = [body('title').trim().notEmpty().withMessage('Title is required'), ...titleRules];

export const serviceCreateRules = [
  ...titleCreateRules,
  body('description').trim().isLength({ min: 10, max: 600 }).withMessage('Description must be 10–600 characters'),
];

export const articleCreateRules = [
  ...titleCreateRules,
  body('content').trim().isLength({ min: 20 }).withMessage('Article content is too short'),
];

export const imageUploadRules = [
  body('category').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid category'),
  body('project').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid project'),
  body('collection').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid collection'),
];

export const imageUpdateRules = [
  param('id').isMongoId().withMessage('Invalid image id'),
  body('category').optional({ values: 'falsy' }).isMongoId(),
  body('project').optional({ values: 'falsy' }).isMongoId(),
  body('collectionId').optional({ values: 'falsy' }).isMongoId(),
  body('altText').optional().isLength({ max: 240 }),
];
