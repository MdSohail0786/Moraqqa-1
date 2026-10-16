import Project from '../models/Project.js';
import Category from '../models/Category.js';
import Image from '../models/Image.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { destroyAsset, destroyAssets } from '../services/cloudinaryService.js';
import { escapeRegex, isObjectId, pageResult, parsePagination, toList, uniqueSlug } from '../utils/helpers.js';

const WRITABLE = [
  'title', 'slug', 'description', 'story', 'location', 'year', 'category', 'style', 'projectType',
  'roomTypes', 'area', 'client', 'designType', 'status', 'featured', 'published', 'coverImage',
  'beforeAfter', 'tags', 'order',
];

const LIST_FIELDS = 'title slug description location year category style projectType roomTypes featured published coverImage imageCount tags status area order createdAt';

const pickBody = (body) => {
  const out = {};
  for (const key of WRITABLE) if (body[key] !== undefined) out[key] = body[key];
  if (out.category === '') out.category = null;
  if (out.year === '' || out.year === null) delete out.year;
  if (out.roomTypes) out.roomTypes = toList(out.roomTypes).map((v) => v.toLowerCase());
  if (out.tags) out.tags = toList(out.tags).map((v) => v.toLowerCase());
  if (out.style) out.style = String(out.style).toLowerCase();
  return out;
};

/** Translates the query string into a Mongo filter. Multiple values per filter are comma separated. */
async function buildFilter(req) {
  const q = req.query;
  const filter = req.user && q.all === 'true' ? {} : { published: true };
  const and = [];

  // `category` may be any category slug: its group decides which project field it targets.
  const categorySlugs = toList(q.category);
  if (categorySlugs.length) {
    const cats = await Category.find({ slug: { $in: categorySlugs } }).lean();
    if (!cats.length) return { _id: null };
    const byGroup = { type: [], style: [], room: [] };
    cats.forEach((c) => byGroup[c.group]?.push(c));
    const or = [];
    if (byGroup.type.length) or.push({ category: { $in: byGroup.type.map((c) => c._id) } });
    if (byGroup.style.length) or.push({ style: { $in: byGroup.style.map((c) => c.slug) } });
    if (byGroup.room.length) or.push({ roomTypes: { $in: byGroup.room.map((c) => c.slug) } });
    and.push({ $or: or });
  }

  const style = toList(q.style).map((s) => s.toLowerCase());
  if (style.length) filter.style = { $in: style };

  const rooms = toList(q.roomType).map((s) => s.toLowerCase());
  if (rooms.length) filter.roomTypes = { $in: rooms };

  const types = toList(q.projectType);
  if (types.length) filter.projectType = { $in: types };

  const years = toList(q.year).map(Number).filter(Boolean);
  if (years.length) filter.year = { $in: years };

  const locations = toList(q.location);
  if (locations.length) {
    and.push({ $or: locations.map((l) => ({ location: new RegExp(`^${escapeRegex(l)}`, 'i') })) });
  }

  if (q.featured === 'true') filter.featured = true;
  if (q.exclude && isObjectId(q.exclude)) filter._id = { $ne: q.exclude };

  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    and.push({ $or: [{ title: rx }, { location: rx }, { tags: rx }, { description: rx }] });
  }

  if (and.length) filter.$and = and;
  return filter;
}

const SORTS = {
  newest: { year: -1, createdAt: -1 },
  oldest: { year: 1, createdAt: 1 },
  title: { title: 1 },
  manual: { order: 1, createdAt: -1 },
};

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 12, max: 48 });
  const filter = await buildFilter(req);
  const sort = SORTS[req.query.sort] || (req.query.featured === 'true' ? SORTS.manual : SORTS.newest);

  const [data, total] = await Promise.all([
    Project.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_FIELDS).populate('category', 'name slug').lean(),
    Project.countDocuments(filter),
  ]);
  res.json({ success: true, ...pageResult(data, total, page, limit) });
});

/** Values available to the filter UI, computed from published projects. */
export const projectFilters = asyncHandler(async (_req, res) => {
  const base = { published: true };
  const [locations, years, styles, roomTypes, projectTypes, categories] = await Promise.all([
    Project.distinct('location', base),
    Project.distinct('year', base),
    Project.distinct('style', base),
    Project.distinct('roomTypes', base),
    Project.distinct('projectType', base),
    Category.find().sort({ group: 1, order: 1 }).select('name slug group').lean(),
  ]);
  const clean = (arr) => arr.filter(Boolean);
  res.json({
    success: true,
    data: {
      locations: clean(locations).sort(),
      years: clean(years).sort((a, b) => b - a),
      styles: clean(styles).sort(),
      roomTypes: clean(roomTypes).sort(),
      projectTypes: clean(projectTypes).sort(),
      categories,
    },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const filter = { slug: req.params.slug };
  if (!req.user) filter.published = true;
  const project = await Project.findOne(filter).populate('category', 'name slug group').select('-gallery').lean();
  if (!project) throw ApiError.notFound('Project not found');
  res.json({ success: true, data: project });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('category', 'name slug group').lean();
  if (!project) throw ApiError.notFound('Project not found');
  res.json({ success: true, data: project });
});

export const relatedProjects = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug }).lean();
  if (!project) throw ApiError.notFound('Project not found');
  const or = [];
  if (project.category) or.push({ category: project.category });
  if (project.style) or.push({ style: project.style });
  if (project.tags?.length) or.push({ tags: { $in: project.tags } });

  let related = or.length
    ? await Project.find({ _id: { $ne: project._id }, published: true, $or: or })
        .sort({ featured: -1, year: -1 })
        .limit(3)
        .select(LIST_FIELDS)
        .populate('category', 'name slug')
        .lean()
    : [];

  if (related.length < 3) {
    const extra = await Project.find({ _id: { $nin: [project._id, ...related.map((r) => r._id)] }, published: true })
      .sort({ createdAt: -1 })
      .limit(3 - related.length)
      .select(LIST_FIELDS)
      .populate('category', 'name slug')
      .lean();
    related = [...related, ...extra];
  }
  res.json({ success: true, data: related });
});

export const createProject = asyncHandler(async (req, res) => {
  const body = pickBody(req.body);
  body.slug = await uniqueSlug(Project, body.slug || body.title);
  const last = await Project.findOne().sort({ order: -1 }).select('order').lean();
  if (body.order === undefined) body.order = (last?.order ?? -1) + 1;
  const project = await Project.create(body);
  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');
  const body = pickBody(req.body);
  if (body.slug || body.title) body.slug = await uniqueSlug(Project, body.slug || body.title, project._id);

  const staleIds = [];
  if (body.beforeAfter) {
    ['before', 'after'].forEach((k) => {
      const oldId = project.beforeAfter?.[k]?.publicId;
      const newId = body.beforeAfter?.[k]?.publicId;
      if (oldId && oldId !== newId) staleIds.push(oldId);
    });
  }
  project.set(body);
  await project.save();
  await Promise.all(staleIds.map(destroyAsset));
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  if (req.query.deleteImages === 'true') {
    const images = await Image.find({ project: project._id }).lean();
    await Image.deleteMany({ project: project._id });
    await destroyAssets(images.filter((i) => !i.isPlaceholder).map((i) => i.cloudinaryPublicId));
  } else {
    // Keep the photos in the library, just detach them
    await Image.updateMany({ project: project._id }, { $unset: { project: 1 } });
  }
  const extra = [project.beforeAfter?.before?.publicId, project.beforeAfter?.after?.publicId];
  await project.deleteOne();
  await destroyAssets(extra);
  res.json({ success: true, message: 'Project deleted' });
});
