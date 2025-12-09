import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';

const preferencesSchema = z.object({
  defaultBusinessId: z.string().optional(),
  defaultDueDays: z.number().min(1).max(365).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultCurrency: z.string().optional(),
  invoicePrefix: z.string().max(10).optional(),
  startingInvoiceNumber: z.number().min(1).optional(),
  paymentTerms: z.string().max(1000).optional(),
  bankDetails: z.string().max(500).optional(),
  defaultPdfTemplate: z.enum(['modern', 'classic', 'minimal']).optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  invoiceFooter: z.string().max(500).optional(),
  termsAndConditions: z.string().max(2000).optional(),
});

// PUT /api/settings/preferences - Update all preferences
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    await dbConnect();

    // Build update object for nested settings
    const updateData = {};
    Object.keys(validation.data).forEach(key => {
      if (key === 'brandColors') {
        Object.keys(validation.data.brandColors).forEach(colorKey => {
          updateData[`settings.brandColors.${colorKey}`] = validation.data.brandColors[colorKey];
        });
      } else {
        updateData[`settings.${key}`] = validation.data[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      settings: updatedUser.settings,
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/settings/preferences - Get all preferences
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.settings,
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
