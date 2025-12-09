import { z } from 'zod';

export const businessSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
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
  taxId: z
    .string()
    .max(50, 'Tax ID must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  currency: z
    .enum(['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'])
    .optional()
    .default('PKR'),
});

export const updateBusinessSchema = businessSchema.partial();
