/**
 * Seed script: npm run seed
 * Creates the admin user, categories, services, collections, sample projects, articles and settings.
 * Images use Cloudinary's public "demo" cloud as DEVELOPMENT PLACEHOLDERS only (a handful, not thousands).
 * Replace them with real uploads from the admin panel.
 */
import { env, assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Service from '../models/Service.js';
import Collection from '../models/Collection.js';
import Project from '../models/Project.js';
import Image from '../models/Image.js';
import Article from '../models/Article.js';
import Setting from '../models/Setting.js';
import { makeSlug, THUMB_TRANSFORM, transformUrl } from './helpers.js';

const DEMO = 'https://res.cloudinary.com/demo/image/upload';
const PLACEHOLDERS = [
  'sample', 'cld-sample', 'cld-sample-2', 'cld-sample-3', 'cld-sample-4', 'cld-sample-5',
  'samples/landscapes/architecture-signs', 'samples/landscapes/nature-mountains', 'samples/landscapes/beach-boat',
];
const asset = (i, alt = '') => {
  const publicId = PLACEHOLDERS[i % PLACEHOLDERS.length];
  return { url: `${DEMO}/${publicId}.jpg`, publicId: `demo/${publicId}`, alt };
};

const CATEGORIES = [
  ['Residential', 'type'], ['Commercial', 'type'], ['Hospitality', 'type'], ['Office', 'type'], ['Restaurant', 'type'],
  ['Luxury', 'style'], ['Modern', 'style'], ['Contemporary', 'style'], ['Classic', 'style'], ['Minimal', 'style'],
  ['Living Room', 'room'], ['Bedroom', 'room'], ['Kitchen', 'room'], ['Bathroom', 'room'], ['Dining', 'room'],
];

const SERVICES = [
  ['Interior Architecture', 'Spatial design that shapes structure, light and circulation into a single considered whole.', 'Residential'],
  ['Residential Interiors', 'Private homes designed around the way you live, from the first sketch to the final cushion.', 'Residential'],
  ['Commercial Interiors', 'Workplaces and retail environments that express a brand and support the people inside them.', 'Commercial'],
  ['Hospitality Design', 'Hotels, restaurants and lounges composed as memorable, atmospheric experiences.', 'Hospitality'],
  ['Space Planning', 'Rigorous layouts that balance flow, function and proportion before a single material is chosen.'],
  ['Furniture Design', 'Bespoke pieces drawn and crafted to fit a space precisely, in materials chosen for longevity.'],
  ['Lighting Design', 'Layered lighting schemes that sculpt volume, highlight material and set the mood of each hour.'],
  ['Material Selection', 'A curated palette of stone, timber, metal and textile, sourced with an eye for tactility and patina.'],
  ['Turnkey Interiors', 'Design, procurement, fit-out and styling delivered under one roof, ready to move in.'],
  ['Project Management', 'Disciplined scheduling, budgeting and site supervision so the finished space matches the vision.'],
];

const PROCESS = [
  { title: 'Consultation', text: 'We listen, visit the site and define the brief, budget and timeline.' },
  { title: 'Concept', text: 'Mood, material and spatial direction are developed into a clear concept.' },
  { title: 'Development', text: 'Detailed drawings, 3D visuals and specifications refine every element.' },
  { title: 'Delivery', text: 'We coordinate craftspeople and suppliers and supervise execution on site.' },
];

const COLLECTIONS = ['Living Spaces', 'Bedrooms', 'Kitchens', 'Bathrooms', 'Dining', 'Offices', 'Lighting', 'Furniture', 'Materials'];

const PROJECTS = [
  { title: 'Marine Drive Residence', location: 'Mumbai, India', year: 2025, cat: 'Residential', style: 'luxury', rooms: ['living-room', 'bedroom'], area: '4,200 sq ft', projectType: 'Residential', featured: true },
  { title: 'Aravalli Villa', location: 'Gurugram, India', year: 2024, cat: 'Residential', style: 'modern', rooms: ['living-room', 'kitchen', 'dining'], area: '6,800 sq ft', projectType: 'Residential', featured: true },
  { title: 'Atelier Office', location: 'Bengaluru, India', year: 2024, cat: 'Office', style: 'minimal', rooms: [], area: '12,000 sq ft', projectType: 'Office', featured: true },
  { title: 'Saffron Table', location: 'New Delhi, India', year: 2023, cat: 'Restaurant', style: 'contemporary', rooms: ['dining'], area: '3,100 sq ft', projectType: 'Hospitality', featured: true },
  { title: 'The Courtyard Hotel', location: 'Jaipur, India', year: 2025, cat: 'Hospitality', style: 'classic', rooms: ['bedroom', 'bathroom'], area: '28,000 sq ft', projectType: 'Hospitality', featured: false },
  { title: 'Stone House', location: 'Mumbai, India', year: 2022, cat: 'Residential', style: 'minimal', rooms: ['bedroom', 'bathroom', 'kitchen'], area: '3,500 sq ft', projectType: 'Residential', featured: false },
];

const STORY = (t) =>
  `${t} began with a simple question: how should a space feel when you step inside?\n\nWe worked with a restrained palette of natural stone, warm timber and soft textiles, allowing light to move across surfaces through the day. Every junction and joint was drawn by hand, and each piece of furniture was selected or made to suit the proportions of the rooms.\n\nThe result is an interior that is quiet, tactile and enduring, designed to age gracefully with the people who live in it.`;

async function run() {
  assertEnv();
  if (!env.adminEmail || !env.adminPassword) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
  await connectDB();

  // ---------------------------------- Admin user ----------------------------------
  let admin = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (!admin) {
    admin = await User.create({ name: 'MORAQQA Admin', email: env.adminEmail, password: env.adminPassword, role: 'admin' });
    console.log(`Created admin user ${admin.email}`);
  } else {
    console.log(`Admin user ${admin.email} already exists (password unchanged)`);
  }

  // Only seed content into an empty database so re-running never duplicates or overwrites real data
  if ((await Project.countDocuments()) > 0) {
    console.log('Content already present. Skipping sample data.');
    return;
  }

  // -------------------------------- Categories ------------------------------------
  const cats = await Category.insertMany(
    CATEGORIES.map(([name, group], order) => ({ name, slug: makeSlug(name), group, order, description: `${name} interior design by MORAQQA.`, coverImage: asset(order, name) }))
  );
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  // -------------------------------- Services --------------------------------------
  await Service.insertMany(
    SERVICES.map(([title, description, relatedName], order) => ({
      title,
      slug: makeSlug(title),
      description,
      content: `${description}\n\nEvery MORAQQA engagement is led by a senior designer who stays with the project from first conversation to handover, ensuring continuity of vision and quality.`,
      image: asset(order + 2, title),
      process: PROCESS,
      relatedCategory: relatedName ? catByName[relatedName]?._id : undefined,
      featured: order < 4,
      order,
    }))
  );

  // -------------------------------- Collections -----------------------------------
  const cols = await Collection.insertMany(
    COLLECTIONS.map((title, order) => ({ title, slug: makeSlug(title), description: `A curated selection of ${title.toLowerCase()} from our portfolio.`, coverImage: asset(order + 1, title), featured: order < 3, order }))
  );

  // -------------------------------- Projects + images -----------------------------
  let imageTotal = 0;
  for (const [index, p] of PROJECTS.entries()) {
    const project = await Project.create({
      title: p.title,
      slug: makeSlug(p.title),
      description: `A ${p.style} ${p.cat.toLowerCase()} interior in ${p.location.split(',')[0]}.`,
      story: STORY(p.title),
      location: p.location,
      year: p.year,
      category: catByName[p.cat]._id,
      style: p.style,
      projectType: p.projectType,
      roomTypes: p.rooms,
      area: p.area,
      client: 'Private Client',
      designType: 'Full Interior Design',
      status: 'Completed',
      featured: p.featured,
      published: true,
      tags: [p.style, p.cat.toLowerCase(), ...p.rooms],
      order: index,
      beforeAfter: index === 0 ? { before: asset(6, 'Before'), after: asset(0, 'After') } : undefined,
    });

    const images = [];
    for (let i = 0; i < 8; i += 1) {
      const a = asset(index + i, `${p.title} — view ${i + 1}`);
      images.push({
        title: `${p.title} ${i + 1}`,
        altText: a.alt,
        cloudinaryUrl: a.url,
        cloudinaryPublicId: `${a.publicId}#${project.slug}-${i}`,
        thumbnailUrl: transformUrl(a.url, THUMB_TRANSFORM),
        category: catByName[p.cat]._id,
        project: project._id,
        collectionId: cols[(index + i) % cols.length]._id,
        tags: [p.style, ...p.rooms],
        featured: i === 0 && p.featured,
        order: i,
        isPlaceholder: true,
      });
    }
    const created = await Image.insertMany(images);
    imageTotal += created.length;
    project.gallery = created.map((i) => i._id);
    project.imageCount = created.length;
    project.coverImage = { url: created[0].cloudinaryUrl, publicId: created[0].cloudinaryPublicId, alt: created[0].altText };
    await project.save();
  }

  // -------------------------------- Journal ---------------------------------------
  await Article.insertMany([
    {
      title: 'Designing with Natural Stone',
      slug: 'designing-with-natural-stone',
      excerpt: 'Why we return to stone again and again, and how to choose it well.',
      content: 'Stone carries the memory of place.\n\nWhen selecting a slab we look first at veining and tone, then at how the surface responds to light at different hours. Honed finishes soften reflections and invite touch, while polished stone adds drama in small, controlled doses.\n\nThe most successful interiors use stone sparingly and let it anchor a palette of warm timber and soft textiles.',
      coverImage: asset(7, 'Natural stone'),
      author: 'MORAQQA Studio',
      category: 'Materials',
      tags: ['materials', 'stone'],
      featured: true,
      published: true,
      publishedAt: new Date(),
    },
    {
      title: 'The Quiet Power of Layered Lighting',
      slug: 'the-quiet-power-of-layered-lighting',
      excerpt: 'Three layers of light that change how a room feels from morning to night.',
      content: 'Good lighting is rarely noticed. It simply makes a room feel right.\n\nWe design in three layers: ambient light for general illumination, task light for function, and accent light to reveal texture and art. Each layer is controlled separately so that the same room can feel energising at noon and intimate by evening.',
      coverImage: asset(4, 'Lighting'),
      author: 'MORAQQA Studio',
      category: 'Lighting',
      tags: ['lighting'],
      featured: false,
      published: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    },
  ]);

  // -------------------------------- Settings --------------------------------------
  await Setting.findOneAndUpdate(
    { key: 'site' },
    {
      key: 'site',
      siteName: 'MORAQQA',
      tagline: 'Crafting Spaces Beyond Imagination',
      heroImage: asset(6, 'MORAQQA interior'),
      introImage: asset(2, 'MORAQQA studio'),
      social: { instagram: 'https://instagram.com/', pinterest: 'https://pinterest.com/', facebook: 'https://facebook.com/', linkedin: 'https://linkedin.com/' },
      contact: { email: 'studio@moraqqa.com', phone: '+91 00000 00000', address: 'Studio address, City, India' },
    },
    { upsert: true, new: true }
  );

  console.log(`Seeded ${cats.length} categories, ${SERVICES.length} services, ${cols.length} collections, ${PROJECTS.length} projects, ${imageTotal} placeholder images.`);
}

run()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
