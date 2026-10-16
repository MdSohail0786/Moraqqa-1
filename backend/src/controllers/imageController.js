import Image from '../models/Image.js';
import Project from '../models/Project.js';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  escapeRegex,
  isObjectId,
  pageResult,
  parsePagination,
  THUMB_TRANSFORM,
  toList,
  transformUrl,
} from '../utils/helpers.js';
import {
  assertConfigured,
  destroyAssets,
  folderPath,
  mapWithConcurrency,
  uploadBuffer,
  validateImageBuffer,
} from '../services/cloudinaryService.js';

const NO_MATCH = { _id: null };

/** Keeps Project.gallery / imageCount / coverImage consistent with its images. */
export async function syncProjectGallery(projectId) {
  if (!projectId) return;
  const images = await Image.find({ project: projectId }).sort({ order: 1, createdAt: 1 }).select('_id cloudinaryUrl cloudinaryPublicId altText').lean();
  const project = await Project.findById(projectId);
  if (!project) return;
  project.gallery = images.map((i) => i._id);
  project.imageCount = images.length;
  const coverStillValid = project.coverImage?.publicId && images.some((i) => i.cloudinaryPublicId === project.coverImage.publicId);
  if (!coverStillValid && !project.coverImage?.publicId) {
    const first = images[0];
    project.coverImage = first ? { url: first.cloudinaryUrl, publicId: first.cloudinaryPublicId, alt: first.altText } : undefined;
  }
  await project.save();
}

async function resolveProjectId(value) {
  if (!value) return undefined;
  if (isObjectId(value)) return value;
  const p = await Project.findOne({ slug: value }).select('_id').lean();
  return p?._id;
}

async function buildFilter(query) {
  const filter = {};

  if (query.category) {
    const cat = isObjectId(query.category)
      ? await Category.findById(query.category).select('_id').lean()
      : await Category.findOne({ slug: query.category }).select('_id').lean();
    if (!cat) return NO_MATCH;
    filter.category = cat._id;
  }
  if (query.project) {
    const id = await resolveProjectId(query.project);
    if (!id) return NO_MATCH;
    filter.project = id;
  }
  if (query.collection) {
    const col = isObjectId(query.collection)
      ? await Collection.findById(query.collection).select('_id').lean()
      : await Collection.findOne({ slug: query.collection }).select('_id').lean();
    if (!col) return NO_MATCH;
    filter.collectionId = col._id;
  }
  if (query.tag) filter.tags = String(query.tag).toLowerCase();
  if (query.featured === 'true') filter.featured = true;
  if (query.unassigned === 'true') Object.assign(filter, { project: null, category: null });
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { altText: rx }, { tags: rx }];
  }
  return filter;
}

/** GET /api/images — server-side paginated, never returns the full library. */
export const listImages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 30, max: 60 });
  const filter = await buildFilter(req.query);
  const sort = req.query.sort === 'newest' ? { createdAt: -1 } : { order: 1, createdAt: -1 };

  const [data, total] = await Promise.all([
    Image.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .populate('category', 'name slug')
      .populate('project', 'title slug')
      .lean(),
    Image.countDocuments(filter),
  ]);
  res.json({ success: true, ...pageResult(data, total, page, limit) });
});

export const getImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id).populate('category', 'name slug').populate('project', 'title slug').lean();
  if (!image) throw ApiError.notFound('Image not found');
  res.json({ success: true, data: image });
});

const titleFromFilename = (name) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** POST /api/images/upload (multipart, field "images") */
export const uploadImages = asyncHandler(async (req, res) => {
  assertConfigured();
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('No images were uploaded');

  const { category, project, collection: collectionRef, subCategory = '' } = req.body;
  const tags = toList(req.body.tags).map((t) => t.toLowerCase());
  const featured = req.body.featured === 'true' || req.body.featured === true;

  const [categoryDoc, projectDoc, collectionDoc] = await Promise.all([
    category ? Category.findById(category).lean() : null,
    project ? Project.findById(project).lean() : null,
    collectionRef ? Collection.findById(collectionRef).lean() : null,
  ]);
  if (category && !categoryDoc) throw ApiError.badRequest('Selected category does not exist');
  if (project && !projectDoc) throw ApiError.badRequest('Selected project does not exist');
  if (collectionRef && !collectionDoc) throw ApiError.badRequest('Selected collection does not exist');

  // moraqqa/projects/<slug> | moraqqa/<category-slug> | moraqqa/collections/<slug> | moraqqa/uncategorized
  const folder = projectDoc
    ? folderPath('projects', projectDoc.slug)
    : categoryDoc
      ? folderPath(categoryDoc.slug)
      : collectionDoc
        ? folderPath('collections', collectionDoc.slug)
        : folderPath('uncategorized');

  const orderScope = projectDoc ? { project: projectDoc._id } : categoryDoc ? { category: categoryDoc._id } : {};
  const last = await Image.findOne(orderScope).sort({ order: -1 }).select('order').lean();
  let nextOrder = (last?.order ?? -1) + 1;
  const orders = files.map(() => nextOrder++);

  const outcomes = await mapWithConcurrency(files, 3, async (file, index) => {
    try {
      const meta = await validateImageBuffer(file.buffer);
      const result = await uploadBuffer(file.buffer, { folder, tags: ['moraqqa'] });
      const title = titleFromFilename(file.originalname);
      const doc = await Image.create({
        title,
        altText: [title, projectDoc?.title, categoryDoc?.name].filter(Boolean).join(' — '),
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        thumbnailUrl: transformUrl(result.secure_url, THUMB_TRANSFORM),
        category: categoryDoc?._id,
        project: projectDoc?._id,
        collectionId: collectionDoc?._id,
        subCategory,
        tags,
        featured,
        order: orders[index],
        width: result.width || meta.width,
        height: result.height || meta.height,
        bytes: result.bytes,
      });
      return { ok: true, image: doc };
    } catch (err) {
      return { ok: false, filename: file.originalname, error: err.message || 'Upload failed' };
    }
  });

  const uploaded = outcomes.filter((o) => o.ok).map((o) => o.image);
  const failed = outcomes.filter((o) => !o.ok).map(({ filename, error }) => ({ filename, error }));

  if (projectDoc && uploaded.length) await syncProjectGallery(projectDoc._id);

  res.status(failed.length && !uploaded.length ? 422 : 201).json({
    success: uploaded.length > 0,
    message: `${uploaded.length} uploaded, ${failed.length} failed`,
    uploaded,
    failed,
  });
});

const EDITABLE = ['title', 'description', 'altText', 'category', 'subCategory', 'project', 'collectionId', 'tags', 'featured', 'order'];

function cleanUpdate(body) {
  const update = {};
  for (const key of EDITABLE) {
    if (body[key] === undefined) continue;
    if (['category', 'project', 'collectionId'].includes(key)) {
      update[key] = body[key] || null;
    } else if (key === 'tags') {
      update.tags = toList(body.tags).map((t) => t.toLowerCase());
    } else {
      update[key] = body[key];
    }
  }
  return update;
}

export const updateImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) throw ApiError.notFound('Image not found');
  const previousProject = image.project;
  image.set(cleanUpdate(req.body));
  await image.save();
  await Promise.all([
    syncProjectGallery(previousProject),
    String(previousProject) !== String(image.project) ? syncProjectGallery(image.project) : null,
  ]);
  res.json({ success: true, data: image });
});

/** PUT /api/images/bulk  { ids: [], update: { category, project, collectionId, featured, tags } } */
export const bulkUpdateImages = asyncHandler(async (req, res) => {
  const ids = (req.body.ids || []).filter(isObjectId);
  if (!ids.length) throw ApiError.badRequest('Select at least one image');
  const update = cleanUpdate(req.body.update || {});
  delete update.order;
  delete update.title;
  if (!Object.keys(update).length) throw ApiError.badRequest('Nothing to update');

  const affected = await Image.find({ _id: { $in: ids } }).select('project').lean();
  const projects = new Set(affected.map((i) => String(i.project)).filter((p) => p && p !== 'undefined'));
  if (update.project) projects.add(String(update.project));

  await Image.updateMany({ _id: { $in: ids } }, { $set: update });
  await Promise.all([...projects].map(syncProjectGallery));
  res.json({ success: true, message: `${ids.length} images updated` });
});

/** PUT /api/images/reorder  { items: [{ id, order }] } */
export const reorderImages = asyncHandler(async (req, res) => {
  const items = (req.body.items || []).filter((i) => isObjectId(i.id));
  if (!items.length) throw ApiError.badRequest('No items to reorder');
  await Image.bulkWrite(
    items.map(({ id, order }) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: Number(order) || 0 } } } }))
  );
  const first = await Image.findById(items[0].id).select('project').lean();
  if (first?.project) await syncProjectGallery(first.project);
  res.json({ success: true, message: 'Order saved' });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) throw ApiError.notFound('Image not found');
  await image.deleteOne();
  if (!image.isPlaceholder) await destroyAssets([image.cloudinaryPublicId]);
  // Clear it as a cover image if it was one
  if (image.project) {
    await Project.updateOne(
      { _id: image.project, 'coverImage.publicId': image.cloudinaryPublicId },
      { $unset: { coverImage: 1 } }
    );
    await syncProjectGallery(image.project);
  }
  res.json({ success: true, message: 'Image deleted' });
});

export const bulkDeleteImages = asyncHandler(async (req, res) => {
  const ids = (req.body.ids || []).filter(isObjectId);
  if (!ids.length) throw ApiError.badRequest('Select at least one image');
  const images = await Image.find({ _id: { $in: ids } }).lean();
  await Image.deleteMany({ _id: { $in: ids } });
  await destroyAssets(images.filter((i) => !i.isPlaceholder).map((i) => i.cloudinaryPublicId));
  const projects = [...new Set(images.map((i) => String(i.project)).filter((p) => p && p !== 'undefined'))];
  for (const id of projects) {
    // eslint-disable-next-line no-await-in-loop
    await Project.updateOne({ _id: id, 'coverImage.publicId': { $in: images.map((i) => i.cloudinaryPublicId) } }, { $unset: { coverImage: 1 } });
    // eslint-disable-next-line no-await-in-loop
    await syncProjectGallery(id);
  }
  res.json({ success: true, message: `${images.length} images deleted` });
});
