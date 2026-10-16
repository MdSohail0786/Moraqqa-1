import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 400, default: '' },
    content: { type: String, required: true },
    coverImage: { type: assetSchema, default: undefined },
    author: { type: String, trim: true, default: 'MORAQQA Studio' },
    category: { type: String, trim: true, default: 'Design' },
    tags: [{ type: String, trim: true, lowercase: true }],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Article', articleSchema);
