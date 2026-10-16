import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    content: { type: String, trim: true, default: '' },
    image: { type: assetSchema, default: undefined },
    process: [
      {
        _id: false,
        title: { type: String, trim: true },
        text: { type: String, trim: true },
      },
    ],
    relatedCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
