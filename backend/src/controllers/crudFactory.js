import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uniqueSlug, parsePagination, pageResult } from '../utils/helpers.js';
import { destroyAsset } from '../services/cloudinaryService.js';

/**
 * Generic CRUD controller used by simple content models
 * (categories, collections, services, journal articles).
 *
 * options:
 *  - slugFrom: field the slug is generated from ("name" | "title")
 *  - sort: default sort for lists
 *  - publicFilter: extra filter applied for unauthenticated requests
 *  - assetFields: asset sub-documents whose Cloudinary files are removed on delete/replace
 *  - populate: populate spec
 *  - beforeSave(body, req): optional hook that can adjust the payload
 *  - paginate: enable page/limit when requested
 *  - allowed: whitelist of writable fields
 */
export function createCrud(Model, options) {
  const {
    slugFrom,
    sort = { order: 1, createdAt: -1 },
    publicFilter = {},
    assetFields = [],
    populate,
    beforeSave,
    allowed,
    filterQuery = () => ({}),
  } = options;

  const pick = (body) => {
    if (!allowed) return { ...body };
    return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  };

  // Drafts are visible only to a signed-in admin who explicitly asks for them (?all=true),
  // so browsing the public site while logged in never leaks unpublished content.
  const baseFilter = (req) => (req.user ? {} : publicFilter);
  const listFilter = (req) => (req.user && req.query.all === 'true' ? {} : publicFilter);

  const list = asyncHandler(async (req, res) => {
    const filter = { ...listFilter(req), ...(await filterQuery(req)) };
    let query = Model.find(filter).sort(sort);
    if (populate) query = query.populate(populate);

    if (req.query.page || req.query.limit) {
      const { page, limit, skip } = parsePagination(req.query, { limit: 12, max: 50 });
      const [data, total] = await Promise.all([
        query.skip(skip).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      return res.json({ success: true, ...pageResult(data, total, page, limit) });
    }
    const data = await query.lean();
    return res.json({ success: true, data, total: data.length });
  });

  const getBySlug = asyncHandler(async (req, res) => {
    let query = Model.findOne({ slug: req.params.slug, ...baseFilter(req) });
    if (populate) query = query.populate(populate);
    const doc = await query.lean();
    if (!doc) throw ApiError.notFound();
    res.json({ success: true, data: doc });
  });

  const getById = asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const doc = await query.lean();
    if (!doc) throw ApiError.notFound();
    res.json({ success: true, data: doc });
  });

  const create = asyncHandler(async (req, res) => {
    const body = pick(req.body);
    if (beforeSave) await beforeSave(body, req);
    if (slugFrom) body.slug = await uniqueSlug(Model, body.slug || body[slugFrom]);
    if (body.order === undefined) {
      const last = await Model.findOne().sort({ order: -1 }).select('order').lean();
      body.order = (last?.order ?? -1) + 1;
    }
    const doc = await Model.create(body);
    res.status(201).json({ success: true, data: doc });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound();
    const body = pick(req.body);
    if (beforeSave) await beforeSave(body, req, doc);
    if (slugFrom && (body.slug || body[slugFrom] !== undefined)) {
      body.slug = await uniqueSlug(Model, body.slug || body[slugFrom] || doc[slugFrom], doc._id);
    }

    // Remove replaced Cloudinary assets
    const staleIds = [];
    for (const field of assetFields) {
      if (body[field] !== undefined) {
        const oldId = doc[field]?.publicId;
        const newId = body[field]?.publicId;
        if (oldId && oldId !== newId) staleIds.push(oldId);
      }
    }
    doc.set(body);
    await doc.save();
    await Promise.all(staleIds.map(destroyAsset));
    res.json({ success: true, data: doc });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound();
    const ids = assetFields.map((f) => doc[f]?.publicId);
    await doc.deleteOne();
    await Promise.all(ids.map(destroyAsset));
    res.json({ success: true, message: 'Deleted' });
  });

  const reorder = asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw ApiError.badRequest('No items provided');
    await Model.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: Number(order) || 0 } } },
      }))
    );
    res.json({ success: true, message: 'Order saved' });
  });

  return { list, getBySlug, getById, create, update, remove, reorder };
}
