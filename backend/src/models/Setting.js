import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

/** Singleton document holding site-wide configuration editable from the admin panel. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'MORAQQA' },
    tagline: { type: String, default: 'Crafting Spaces Beyond Imagination' },
    logo: { type: assetSchema, default: undefined },
    heroImage: { type: assetSchema, default: undefined },
    heroVideoUrl: { type: String, default: '' },
    introImage: { type: assetSchema, default: undefined },
    social: {
      instagram: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      facebook: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    team: [
      {
        _id: false,
        name: { type: String, trim: true },
        role: { type: String, trim: true },
        bio: { type: String, trim: true },
        image: { type: assetSchema, default: undefined },
      },
    ],
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
