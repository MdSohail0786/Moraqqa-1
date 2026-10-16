import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  { email: { type: String, required: true, unique: true, lowercase: true, trim: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Subscriber', subscriberSchema);
