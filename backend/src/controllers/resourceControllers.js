import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Service from '../models/Service.js';
import Article from '../models/Article.js';
import Project from '../models/Project.js';
import Image from '../models/Image.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createCrud } from './crudFactory.js';
import { destroyAsset } from '../services/cloudinaryService.js';

/* ---------------------------------- Categories --------------------------------- */
export const categories = createCrud(Category, {
  slugFrom: 'name',
  sort: { group: 1, order: 1, name: 1 },
  assetFields: ['coverImage'],
  allowed: ['name', 'slug', 'group', 'description', 'coverImage', 'order'],
  filterQuery: (req) => (req.query.group ? { group: req.query.group } : {}),
});

categories.remove = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound();
  // Detach instead of leaving dangling references
  await Promise.all([
    Project.updateMany({ category: cat._id }, { $unset: { category: 1 } }),
    Image.updateMany({ category: cat._id }, { $unset: { category: 1 } }),
    Service.updateMany({ relatedCategory: cat._id }, { $unset: { relatedCategory: 1 } }),
  ]);
  const publicId = cat.coverImage?.publicId;
  await cat.deleteOne();
  await destroyAsset(publicId);
  res.json({ success: true, message: 'Category deleted' });
});

/* ---------------------------------- Collections -------------------------------- */
export const collections = createCrud(Collection, {
  slugFrom: 'title',
  assetFields: ['coverImage'],
  allowed: ['title', 'slug', 'description', 'coverImage', 'featured', 'order'],
});

collections.remove = asyncHandler(async (req, res) => {
  const col = await Collection.findById(req.params.id);
  if (!col) throw ApiError.notFound();
  await Image.updateMany({ collectionId: col._id }, { $unset: { collectionId: 1 } });
  const publicId = col.coverImage?.publicId;
  await col.deleteOne();
  await destroyAsset(publicId);
  res.json({ success: true, message: 'Collection deleted' });
});

// Public list also returns an image count per collection
collections.listWithCounts = asyncHandler(async (req, res) => {
  const list = await Collection.find().sort({ order: 1, createdAt: -1 }).lean();
  const counts = await Image.aggregate([
    { $match: { collectionId: { $in: list.map((c) => c._id) } } },
    { $group: { _id: '$collectionId', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    data: list.map((c) => ({ ...c, imageCount: map.get(String(c._id)) || 0 })),
  });
});

/* ------------------------------------ Services --------------------------------- */
export const services = createCrud(Service, {
  slugFrom: 'title',
  assetFields: ['image'],
  populate: { path: 'relatedCategory', select: 'name slug group' },
  allowed: ['title', 'slug', 'description', 'content', 'image', 'process', 'relatedCategory', 'featured', 'order'],
  filterQuery: (req) => (req.query.featured === 'true' ? { featured: true } : {}),
});

/* ------------------------------------ Journal ---------------------------------- */
export const articles = createCrud(Article, {
  slugFrom: 'title',
  sort: { publishedAt: -1, createdAt: -1 },
  publicFilter: { published: true },
  assetFields: ['coverImage'],
  allowed: ['title', 'slug', 'excerpt', 'content', 'coverImage', 'author', 'category', 'tags', 'featured', 'published', 'publishedAt'],
  filterQuery: (req) => {
    const f = {};
    if (req.query.featured === 'true') f.featured = true;
    if (req.query.category) f.category = req.query.category;
    return f;
  },
  beforeSave: (body, _req, existing) => {
    const willPublish = body.published ?? existing?.published;
    if (willPublish && !body.publishedAt && !existing?.publishedAt) body.publishedAt = new Date();
    if (body.published === false) body.publishedAt = existing?.publishedAt;
  },
});
