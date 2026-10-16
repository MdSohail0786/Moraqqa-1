import mongoose from 'mongoose';

export const ENQUIRY_STATUSES = ['New', 'Contacted', 'In Discussion', 'Converted', 'Closed'];
export const PROJECT_TYPES = ['Residential', 'Commercial', 'Hospitality', 'Office', 'Other'];
export const BUDGETS = ['Under ₹10L', '₹10L–₹25L', '₹25L–₹50L', '₹50L–₹1Cr', '₹1Cr+'];

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    city: { type: String, trim: true, maxlength: 100, default: '' },
    projectType: { type: String, enum: PROJECT_TYPES, required: true },
    budget: { type: String, enum: BUDGETS, required: true },
    area: { type: String, trim: true, maxlength: 60, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'New', index: true },
    read: { type: Boolean, default: false, index: true },
    notes: { type: String, trim: true, maxlength: 3000, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('Enquiry', enquirySchema);
