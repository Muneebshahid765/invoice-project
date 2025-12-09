import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';

const notificationsSchema = z.object({
  email: z.object({
    invoiceCreated: z.boolean().optional(),
    paymentReceived: z.boolean().optional(),
    invoiceOverdue: z.boolean().optional(),
    customerViewed: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
  }).optional(),
  whatsapp: z.object({
    enabled: z.boolean().optional(),
    phoneNumber: z.string().optional(),
  }).optional(),
  reminders: z.object({
    daysBeforeDue: z.number().min(1).max(30).optional(),
    daysAfterDue: z.number().min(1).max(30).optional(),
    frequency: z.enum(['once', 'daily', 'weekly']).optional(),
  }).optional(),
});

// PUT /api/settings/notifications - Update notification settings
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
    const validation = notificationsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    await dbConnect();

    // Build update object for nested notifications
    const updateData = {};
    
    if (validation.data.email) {
      Object.keys(validation.data.email).forEach(key => {
        updateData[`notifications.email.${key}`] = validation.data.email[key];
      });
    }
    
    if (validation.data.whatsapp) {
      Object.keys(validation.data.whatsapp).forEach(key => {
        updateData[`notifications.whatsapp.${key}`] = validation.data.whatsapp[key];
      });
    }
    
    if (validation.data.reminders) {
      Object.keys(validation.data.reminders).forEach(key => {
        updateData[`notifications.reminders.${key}`] = validation.data.reminders[key];
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      notifications: updatedUser.notifications,
    });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/settings/notifications - Get notification settings
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
      notifications: user.notifications,
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
