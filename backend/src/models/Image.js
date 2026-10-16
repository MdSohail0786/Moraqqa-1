import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 160, default: '' },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true, index: true },
    thumbnailUrl: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    subCategory: { type: String, trim: true, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    // "collection" is a reserved Mongoose key, so the reference is named collectionId.
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', index: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    altText: { type: String, trim: true, maxlength: 240, default: '' },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    width: Number,
    height: Number,
    bytes: Number,
    /** Dev-only placeholder pointing at Cloudinary demo assets (never deleted remotely). */
    isPlaceholder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

imageSchema.index({ project: 1, order: 1 });
imageSchema.index({ category: 1, order: 1 });
imageSchema.index({ collectionId: 1, order: 1 });

export default mongoose.model('Image', imageSchema);
