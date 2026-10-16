import { Router } from 'express';
import { protect, optionalAuth, restrictTo } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { sanitizeInput } from '../middlewares/sanitize.js';
import { cache } from '../middlewares/cache.js';
import { authLimiter, enquiryLimiter, uploadLimiter } from '../middlewares/rateLimiters.js';
import { uploadImages as uploadImagesMw, uploadSingle } from '../middlewares/upload.js';
import * as v from '../validators/index.js';

import { login, logout, me, changePassword } from '../controllers/authController.js';
import {
  listProjects, projectFilters, getProject, getProjectById, relatedProjects,
  createProject, updateProject, deleteProject,
} from '../controllers/projectController.js';
import {
  listImages, getImage, uploadImages, updateImage, bulkUpdateImages, reorderImages,
  deleteImage, bulkDeleteImages,
} from '../controllers/imageController.js';
import { categories, collections, services, articles } from '../controllers/resourceControllers.js';
import {
  createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry, subscribe, listSubscribers,
  getPublicSettings, updateSettings, uploadMedia, search, dashboardStats, sitemap,
} from '../controllers/miscControllers.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
const admin = [protect, restrictTo('admin', 'editor')];
const adminOnly = [protect, restrictTo('admin')];

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
router.get('/sitemap.xml', sitemap);

/* ----------------------------------- Auth ----------------------------------- */
router.post('/auth/login', authLimiter, v.loginRules, validate, login);
router.get('/auth/me', protect, me);
router.post('/auth/logout', logout);
router.put('/auth/password', protect, v.passwordRules, validate, changePassword);

/* --------------------------------- Settings --------------------------------- */
router.get('/settings', cache(300), getPublicSettings);
router.put('/settings', ...admin, updateSettings);

/* --------------------------------- Projects --------------------------------- */
router.get('/projects', optionalAuth, cache(60), listProjects);
router.get('/projects/filters', cache(120), projectFilters);
router.get('/projects/id/:id', ...admin, v.idRule, validate, getProjectById);
router.get('/projects/:slug/related', cache(120), relatedProjects);
router.get('/projects/:slug', optionalAuth, cache(60), getProject);
router.post('/projects', ...admin, v.projectCreateRules, validate, createProject);
router.put('/projects/:id', ...admin, v.idRule, v.projectRules, validate, updateProject);
router.delete('/projects/:id', ...admin, v.idRule, validate, deleteProject);

/* ---------------------------------- Images ---------------------------------- */
router.get('/images', cache(60), listImages);
router.put('/images/bulk', ...admin, bulkUpdateImages);
router.put('/images/reorder', ...admin, reorderImages);
router.post('/images/bulk-delete', ...admin, bulkDeleteImages);
router.post('/images/upload', ...admin, uploadLimiter, uploadImagesMw, sanitizeInput, v.imageUploadRules, validate, uploadImages);
router.get('/images/:id', v.idRule, validate, getImage);
router.put('/images/:id', ...admin, v.imageUpdateRules, validate, updateImage);
router.delete('/images/:id', ...admin, v.idRule, validate, deleteImage);

/* Single asset upload (logo, covers, before/after) */
router.post('/media/upload', ...admin, uploadLimiter, uploadSingle, sanitizeInput, uploadMedia);

/* -------------------------------- Categories -------------------------------- */
router.get('/categories', optionalAuth, cache(120), categories.list);
router.put('/categories/reorder', ...admin, categories.reorder);
router.get('/categories/:slug', cache(120), categories.getBySlug);
router.post('/categories', ...admin, v.categoryCreateRules, validate, categories.create);
router.put('/categories/:id', ...admin, v.idRule, v.categoryRules, validate, categories.update);
router.delete('/categories/:id', ...admin, v.idRule, validate, categories.remove);

/* -------------------------------- Collections ------------------------------- */
router.get('/collections', optionalAuth, cache(120), collections.listWithCounts);
router.put('/collections/reorder', ...admin, collections.reorder);
router.get('/collections/:slug', cache(120), collections.getBySlug);
router.post('/collections', ...admin, v.titleCreateRules, validate, collections.create);
router.put('/collections/:id', ...admin, v.idRule, v.titleRules, validate, collections.update);
router.delete('/collections/:id', ...admin, v.idRule, validate, collections.remove);

/* --------------------------------- Services --------------------------------- */
router.get('/services', optionalAuth, cache(120), services.list);
router.put('/services/reorder', ...admin, services.reorder);
router.get(
  '/services/:slug/projects',
  cache(120),
  asyncHandler(async (req, res) => {
    const service = await Service.findOne({ slug: req.params.slug }).lean();
    if (!service) throw ApiError.notFound('Service not found');
    const filter = { published: true };
    if (service.relatedCategory) filter.category = service.relatedCategory;
    const data = await Project.find(filter)
      .sort({ featured: -1, year: -1 })
      .limit(3)
      .select('title slug location year projectType coverImage category')
      .populate('category', 'name slug')
      .lean();
    res.json({ success: true, data });
  })
);
router.get('/services/:slug', cache(120), services.getBySlug);
router.post('/services', ...admin, v.serviceCreateRules, validate, services.create);
router.put('/services/:id', ...admin, v.idRule, v.titleRules, validate, services.update);
router.delete('/services/:id', ...admin, v.idRule, validate, services.remove);

/* ---------------------------------- Journal --------------------------------- */
router.get('/journal', optionalAuth, cache(60), articles.list);
router.get('/journal/id/:id', ...admin, v.idRule, validate, articles.getById);
router.get('/journal/:slug', optionalAuth, cache(60), articles.getBySlug);
router.post('/journal', ...admin, v.articleCreateRules, validate, articles.create);
router.put('/journal/:id', ...admin, v.idRule, v.titleRules, validate, articles.update);
router.delete('/journal/:id', ...admin, v.idRule, validate, articles.remove);

/* --------------------------------- Enquiries -------------------------------- */
router.post('/enquiries', enquiryLimiter, v.enquiryRules, validate, createEnquiry);
router.get('/enquiries', ...admin, listEnquiries);
router.put('/enquiries/:id', ...admin, v.enquiryUpdateRules, validate, updateEnquiry);
router.delete('/enquiries/:id', ...admin, v.idRule, validate, deleteEnquiry);

/* -------------------------------- Newsletter -------------------------------- */
router.post('/newsletter', enquiryLimiter, v.newsletterRules, validate, subscribe);
router.get('/newsletter', ...admin, listSubscribers);

/* ----------------------------- Search & statistics ---------------------------- */
router.get('/search', cache(30), search);
router.get('/stats', ...adminOnly, dashboardStats);

export default router;
