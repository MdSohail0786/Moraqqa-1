import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

/**
 * group: "type"  -> project type (Residential, Commercial ...)
 *        "style" -> design style (Modern, Classic ...)
 *        "room"  -> room type (Bedroom, Kitchen ...)
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, index: true },
    group: { type: String, enum: ['type', 'style', 'room'], default: 'type', index: true },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    coverImage: { type: assetSchema, default: undefined },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
