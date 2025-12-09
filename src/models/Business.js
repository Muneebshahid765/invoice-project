import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name must be less than 100 characters'],
  },
  logo: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'Pakistan' },
  },
  taxId: {
    type: String,
    trim: true,
    default: '',
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
BusinessSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
BusinessSchema.index({ userId: 1 });
BusinessSchema.index({ isDeleted: 1 });

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);
