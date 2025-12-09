import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be less than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
  },
  timezone: {
    type: String,
    default: 'Asia/Karachi',
  },
  language: {
    type: String,
    enum: ['en', 'ur'],
    default: 'en',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  
  // Subscription fields
  subscriptionPlan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    default: 'FREE',
  },
  subscriptionStatus: {
    type: String,
    enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'],
    default: 'TRIAL',
  },
  trialStartDate: {
    type: Date,
    default: Date.now,
  },
  trialEndDate: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
  },
  subscriptionStartDate: {
    type: Date,
  },
  subscriptionEndDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['MANUAL', 'JAZZCASH', 'EASYPAISA', 'STRIPE', 'BANK_TRANSFER'],
  },
  stripeCustomerId: {
    type: String,
  },
  
  // Plan limits
  invoiceLimit: {
    type: Number,
    default: 5, // FREE plan default
  },
  businessLimit: {
    type: Number,
    default: 1, // FREE plan default
  },
  invoicesCreatedThisMonth: {
    type: Number,
    default: 0,
  },
  lastInvoiceCountReset: {
    type: Date,
    default: Date.now,
  },
  
  // Settings & Preferences
  settings: {
    defaultBusinessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    },
    defaultDueDays: {
      type: Number,
      default: 30,
    },
    defaultTaxRate: {
      type: Number,
      default: 0,
    },
    defaultCurrency: {
      type: String,
      default: 'PKR',
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
    },
    startingInvoiceNumber: {
      type: Number,
      default: 1,
    },
    paymentTerms: {
      type: String,
      default: 'Payment is due within the specified due date.',
    },
    bankDetails: {
      type: String,
    },
    defaultPdfTemplate: {
      type: String,
      enum: ['modern', 'classic', 'minimal'],
      default: 'modern',
    },
    brandColors: {
      primary: { type: String, default: '#3b82f6' },
      secondary: { type: String, default: '#1e40af' },
      text: { type: String, default: '#1f2937' },
    },
    customLogo: {
      type: String,
    },
    invoiceFooter: {
      type: String,
    },
    termsAndConditions: {
      type: String,
    },
  },
  
  // Notification preferences
  notifications: {
    email: {
      invoiceCreated: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      invoiceOverdue: { type: Boolean, default: true },
      customerViewed: { type: Boolean, default: false },
      weeklySummary: { type: Boolean, default: true },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phoneNumber: { type: String },
    },
    reminders: {
      daysBeforeDue: { type: Number, default: 3 },
      daysAfterDue: { type: Number, default: 7 },
      frequency: { type: String, enum: ['once', 'daily', 'weekly'], default: 'once' },
    },
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  
  // Onboarding
  onboarding: {
    completed: { type: Boolean, default: false },
    steps: {
      addedBusiness: { type: Boolean, default: false },
      addedCustomer: { type: Boolean, default: false },
      createdInvoice: { type: Boolean, default: false },
      downloadedPdf: { type: Boolean, default: false },
    },
  },
  
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
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

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
