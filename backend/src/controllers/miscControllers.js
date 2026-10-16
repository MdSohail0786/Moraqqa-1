import Enquiry, { ENQUIRY_STATUSES } from '../models/Enquiry.js';
import Setting from '../models/Setting.js';
import Subscriber from '../models/Subscriber.js';
import Project from '../models/Project.js';
import Image from '../models/Image.js';
import Category from '../models/Category.js';
import Service from '../models/Service.js';
import Collection from '../models/Collection.js';
import Article from '../models/Article.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { escapeRegex, pageResult, parsePagination } from '../utils/helpers.js';
import { assertConfigured, destroyAsset, folderPath, uploadBuffer, validateImageBuffer } from '../services/cloudinaryService.js';

/* ----------------------------------- Enquiries ---------------------------------- */
export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, city, projectType, budget, area, message } = req.body;
  await Enquiry.create({ name, email, phone, city, projectType, budget, area, message });
  res.status(201).json({ success: true, message: 'Thank you. Our studio will be in touch shortly.' });
});

export const listEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 20, max: 100 });
  const filter = {};
  if (req.query.status && ENQUIRY_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.read === 'true') filter.read = true;
  if (req.query.read === 'false') filter.read = false;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { city: rx }, { message: rx }];
  }
  const [data, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ success: true, ...pageResult(data, total, page, limit) });
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const update = {};
  ['status', 'read', 'notes'].forEach((k) => {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  });
  // Moving past "New" counts as having read it
  if (update.status && update.status !== 'New' && update.read === undefined) update.read = true;
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.json({ success: true, data: enquiry });
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.json({ success: true, message: 'Enquiry deleted' });
});

/* ----------------------------------- Newsletter --------------------------------- */
export const subscribe = asyncHandler(async (req, res) => {
  try {
    await Subscriber.create({ email: req.body.email });
  } catch (err) {
    if (err.code !== 11000) throw err; // already subscribed is not an error for the visitor
  }
  res.status(201).json({ success: true, message: 'You are on the list. Thank you.' });
});

export const listSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 50, max: 200 });
  const [data, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscriber.countDocuments(),
  ]);
  res.json({ success: true, ...pageResult(data, total, page, limit) });
});

/* ------------------------------------ Settings ---------------------------------- */
async function getSettings() {
  let settings = await Setting.findOne({ key: 'site' });
  if (!settings) settings = await Setting.create({ key: 'site' });
  return settings;
}

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const s = (await getSettings()).toObject();
  res.json({
    success: true,
    data: {
      siteName: s.siteName,
      tagline: s.tagline,
      logo: s.logo,
      heroImage: s.heroImage,
      heroVideoUrl: s.heroVideoUrl,
      introImage: s.introImage,
      social: s.social,
      contact: s.contact,
      team: s.team,
      whatsapp: { number: env.whatsappNumber, message: 'Hello MORAQQA, I would like to discuss an interior design project.' },
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const body = req.body;
  const fields = ['siteName', 'tagline', 'logo', 'heroImage', 'heroVideoUrl', 'introImage', 'social', 'contact', 'team'];
  const stale = [];
  ['logo', 'heroImage', 'introImage'].forEach((f) => {
    if (body[f] !== undefined && settings[f]?.publicId && settings[f].publicId !== body[f]?.publicId) {
      stale.push(settings[f].publicId);
    }
  });
  fields.forEach((f) => {
    if (body[f] !== undefined) settings.set(f, body[f]);
  });
  await settings.save();
  await Promise.all(stale.map(destroyAsset));
  res.json({ success: true, data: settings });
});

/* -------------------------------------- Media ----------------------------------- */
/** Single-asset upload for logos, covers and before/after images (not stored in the image library). */
export const uploadMedia = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw ApiError.badRequest('No image was uploaded');
  await validateImageBuffer(req.file.buffer);
  const folderName = String(req.body.folder || 'site').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'site';
  const result = await uploadBuffer(req.file.buffer, { folder: folderPath('site', folderName) });
  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height },
  });
});

/* -------------------------------------- Search ---------------------------------- */
export const search = asyncHandler(async (req, res) => {
  const raw = String(req.query.q || '').trim().slice(0, 80);
  if (raw.length < 2) return res.json({ success: true, data: { projects: [], categories: [], services: [], collections: [], articles: [] }, query: raw });

  const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
  const rx = tokens.map((t) => new RegExp(escapeRegex(t), 'i'));

  // Resolve category matches per token ("bedroom", "modern" ...)
  const catMatches = await Category.find({ $or: rx.map((r) => ({ name: r })) }).lean();

  const projectAnd = tokens.map((_, i) => {
    const cats = catMatches.filter((c) => rx[i].test(c.name));
    const or = [{ title: rx[i] }, { location: rx[i] }, { tags: rx[i] }, { style: rx[i] }, { projectType: rx[i] }, { roomTypes: rx[i] }, { description: rx[i] }];
    cats.forEach((c) => {
      if (c.group === 'type') or.push({ category: c._id });
      if (c.group === 'style') or.push({ style: c.slug });
      if (c.group === 'room') or.push({ roomTypes: c.slug });
    });
    return { $or: or };
  });

  const fullRx = new RegExp(escapeRegex(raw), 'i');
  const [projects, categories, services, collections, articles] = await Promise.all([
    Project.find({ published: true, $and: projectAnd })
      .sort({ featured: -1, year: -1 })
      .limit(12)
      .select('title slug location year style projectType coverImage category')
      .populate('category', 'name slug')
      .lean(),
    Category.find({ $or: [{ name: fullRx }, ...rx.map((r) => ({ name: r }))] }).limit(8).select('name slug group').lean(),
    Service.find({ $or: [{ title: fullRx }, { description: fullRx }] }).limit(6).select('title slug description image').lean(),
    Collection.find({ $or: [{ title: fullRx }, { description: fullRx }] }).limit(6).select('title slug description coverImage').lean(),
    Article.find({ published: true, $or: [{ title: fullRx }, { tags: fullRx }, { excerpt: fullRx }] }).limit(6).select('title slug excerpt coverImage').lean(),
  ]);

  res.json({ success: true, query: raw, data: { projects, categories, services, collections, articles } });
});

/* -------------------------------------- Stats ----------------------------------- */
export const dashboardStats = asyncHandler(async (_req, res) => {
  const [projects, publishedProjects, featuredProjects, images, enquiries, unread, categories, services, articles, subscribers, recent] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ published: true }),
    Project.countDocuments({ featured: true }),
    Image.countDocuments(),
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ read: false }),
    Category.countDocuments(),
    Service.countDocuments(),
    Article.countDocuments(),
    Subscriber.countDocuments(),
    Enquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  res.json({
    success: true,
    data: { projects, publishedProjects, featuredProjects, images, enquiries, unread, categories, services, articles, subscribers, recentEnquiries: recent },
  });
});

/* ------------------------------------- Sitemap ---------------------------------- */
export const sitemap = asyncHandler(async (_req, res) => {
  const [projects, services, collections, articles, categories] = await Promise.all([
    Project.find({ published: true }).select('slug updatedAt').lean(),
    Service.find().select('slug updatedAt').lean(),
    Collection.find().select('slug updatedAt').lean(),
    Article.find({ published: true }).select('slug updatedAt').lean(),
    Category.find().select('slug updatedAt').lean(),
  ]);
  const base = env.siteUrl;
  const urls = [
    ...['', '/about', '/projects', '/services', '/collections', '/journal', '/contact'].map((p) => ({ loc: `${base}${p}` })),
    ...projects.map((p) => ({ loc: `${base}/projects/${p.slug}`, lastmod: p.updatedAt })),
    ...categories.map((c) => ({ loc: `${base}/projects/${c.slug}`, lastmod: c.updatedAt })),
    ...services.map((s) => ({ loc: `${base}/services/${s.slug}`, lastmod: s.updatedAt })),
    ...collections.map((c) => ({ loc: `${base}/collections/${c.slug}`, lastmod: c.updatedAt })),
    ...articles.map((a) => ({ loc: `${base}/journal/${a.slug}`, lastmod: a.updatedAt })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>`;
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
});
