import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    story: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    year: { type: Number, min: 1900, max: 2100 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    style: { type: String, trim: true, lowercase: true, default: '', index: true },
    projectType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Hospitality', 'Office', 'Other'],
      default: 'Residential',
      index: true,
    },
    roomTypes: [{ type: String, trim: true, lowercase: true }],
    area: { type: String, trim: true, default: '' },
    client: { type: String, trim: true, default: '' },
    designType: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Completed', 'In Progress', 'Concept'], default: 'Completed' },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    coverImage: { type: assetSchema, default: undefined },
    /** Ordered image ids, kept in sync with Image.order by the image controller. */
    gallery: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    imageCount: { type: Number, default: 0 },
    beforeAfter: {
      before: { type: assetSchema, default: undefined },
      after: { type: assetSchema, default: undefined },
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectSchema.index({ title: 'text', description: 'text', location: 'text', tags: 'text' });

export default mongoose.model('Project', projectSchema);
