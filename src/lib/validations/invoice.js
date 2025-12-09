import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Item description is required')
    .max(500, 'Description must be less than 500 characters'),
  quantity: z
    .number()
    .min(0, 'Quantity cannot be negative')
    .default(1),
  price: z
    .number()
    .min(0, 'Price cannot be negative'),
});

export const invoiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  date: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one item is required'),
  taxRate: z
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .optional()
    .default(0),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .optional()
    .default(0),
  discountType: z
    .enum(['fixed', 'percentage'])
    .optional()
    .default('fixed'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  terms: z
    .string()
    .max(1000, 'Terms must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
    .optional()
    .default('DRAFT'),
});

export const updateInvoiceSchema = invoiceSchema.partial().omit({ businessId: true });

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
});
