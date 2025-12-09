import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  total: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  items: {
    type: [InvoiceItemSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one item is required',
    },
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  total: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT',
  },
  notes: {
    type: String,
    default: '',
    maxlength: [1000, 'Notes must be less than 1000 characters'],
  },
  terms: {
    type: String,
    default: '',
    maxlength: [1000, 'Terms must be less than 1000 characters'],
  },
  paidAt: {
    type: Date,
    default: null,
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

// Calculate item totals and invoice totals before saving
InvoiceSchema.pre('save', function (next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.total = item.quantity * item.price;
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

  // Calculate discount
  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (this.subtotal * this.discount) / 100;
  } else {
    discountAmount = this.discount;
  }

  // Calculate tax
  const taxableAmount = this.subtotal - discountAmount;
  this.tax = (taxableAmount * this.taxRate) / 100;

  // Calculate total
  this.total = taxableAmount + this.tax;

  // Update timestamp
  this.updatedAt = new Date();

  next();
});

// Indexes for faster queries
InvoiceSchema.index({ businessId: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ date: -1 });
InvoiceSchema.index({ isDeleted: 1 });

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function (businessId) {
  const lastInvoice = await this.findOne({ businessId })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  if (!lastInvoice) {
    return 'INV-0001';
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1], 10);
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `INV-${newNumber}`;
};

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
