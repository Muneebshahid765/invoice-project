import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'INVOICE_CREATED',
      'INVOICE_SENT',
      'INVOICE_PAID',
      'INVOICE_OVERDUE',
      'INVOICE_VIEWED',
      'CUSTOMER_ADDED',
      'BUSINESS_ADDED',
      'PAYMENT_RECEIVED',
      'SUBSCRIPTION_EXPIRING',
      'SUBSCRIPTION_EXPIRED',
      'TRIAL_ENDING',
      'SYSTEM',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    // Can contain invoiceId, customerId, amount, etc.
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  link: {
    type: String,
    // URL to navigate to when notification is clicked
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  return this.create(data);
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
