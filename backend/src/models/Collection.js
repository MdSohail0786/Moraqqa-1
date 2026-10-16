import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

const collectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 800, default: '' },
    coverImage: { type: assetSchema, default: undefined },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Collection', collectionSchema);
