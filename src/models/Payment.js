import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'PKR',
  },
  amountUSD: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    enum: ['STRIPE', 'MANUAL', 'JAZZCASH', 'EASYPAISA', 'BANK'],
    default: 'STRIPE',
  },
  stripeSessionId: {
    type: String,
    index: true,
  },
  stripePaymentIntentId: {
    type: String,
  },
  stripeCustomerId: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  receiptUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  refundedAt: {
    type: Date,
  },
  refundReason: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentMethod: 1 });

// Static methods
PaymentSchema.statics.getRevenueStats = async function(startDate, endDate) {
  const match = { status: 'COMPLETED' };
  if (startDate) match.paidAt = { $gte: startDate };
  if (endDate) match.paidAt = { ...match.paidAt, $lte: endDate };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        avgPayment: { $avg: '$amount' },
      },
    },
  ]);

  return stats[0] || { totalRevenue: 0, totalPayments: 0, avgPayment: 0 };
};

PaymentSchema.statics.getMonthlyRevenue = async function(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        status: 'COMPLETED',
        paidAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

PaymentSchema.statics.getRevenueByPlan = async function() {
  return this.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: '$plan',
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
