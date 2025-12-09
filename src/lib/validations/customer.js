import { z } from 'zod';

export const customerSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  name: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be less than 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  address: z.object({
    street: z.string().max(200).optional().default(''),
    city: z.string().max(100).optional().default(''),
    state: z.string().max(100).optional().default(''),
    postalCode: z.string().max(20).optional().default(''),
    country: z.string().max(100).optional().default('Pakistan'),
  }).optional().default({}),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export const updateCustomerSchema = customerSchema.partial().omit({ businessId: true });
