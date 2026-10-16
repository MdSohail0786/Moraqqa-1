import mongoose from 'mongoose';

/** A Cloudinary asset reference stored inside other documents. */
export const assetSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: false }
);
