import slugify from 'slugify';
import mongoose from 'mongoose';

export const makeSlug = (text) => slugify(String(text || ''), { lower: true, strict: true, trim: true });

/** Returns a slug that is unique within the model's collection. */
export async function uniqueSlug(Model, text, excludeId) {
  const base = makeSlug(text) || 'item';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);

export const toList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

export function parsePagination(query, { limit: defLimit = 12, max = 60 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageResult = (data, total, page, limit) => ({
  data,
  page,
  limit,
  total,
  pages: Math.ceil(total / limit) || 1,
  hasMore: page * limit < total,
});

/** Inserts a Cloudinary transformation string into a delivery URL. */
export function transformUrl(url, transformation) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transformation}/`);
}

export const THUMB_TRANSFORM = 'c_fill,w_480,h_360,g_auto,q_auto,f_auto';
