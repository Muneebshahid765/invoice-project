import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTERED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_RESET',
      'BUSINESS_CREATED',
      'BUSINESS_UPDATED',
      'BUSINESS_DELETED',
      'CUSTOMER_CREATED',
      'CUSTOMER_UPDATED',
      'CUSTOMER_DELETED',
      'INVOICE_CREATED',
      'INVOICE_UPDATED',
      'INVOICE_SENT',
      'INVOICE_PAID',
      'INVOICE_CANCELLED',
      'INVOICE_DELETED',
      'PAYMENT_RECEIVED',
      'SETTINGS_UPDATED',
    ],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'business', 'customer', 'invoice', 'payment', 'settings'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ entityType: 1 });
ActivityLogSchema.index({ entityId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete logs after 90 days (optional)
// ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
