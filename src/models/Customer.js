import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name must be less than 100 characters'],
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
  notes: {
    type: String,
    default: '',
    maxlength: [500, 'Notes must be less than 500 characters'],
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
CustomerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for faster queries
CustomerSchema.index({ businessId: 1 });
CustomerSchema.index({ name: 'text', email: 'text' });
CustomerSchema.index({ isDeleted: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
