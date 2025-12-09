import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// POST /api/subscription/cancel - Cancel subscription
export async function POST(request) {
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
    const { reason } = body;

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.subscriptionPlan === 'FREE') {
      return NextResponse.json({ 
        error: 'Cannot cancel free plan' 
      }, { status: 400 });
    }

    // Update subscription status to cancelled
    // Subscription remains active until end date
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        subscriptionStatus: 'CANCELLED',
        // Keep the subscription active until end date
        // After end date, user will be downgraded to FREE
      },
      { new: true }
    );

    // TODO: Send cancellation confirmation email
    // TODO: Log cancellation reason for analytics
    // TODO: Schedule downgrade job for subscription end date

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        plan: updatedUser.subscriptionPlan,
        status: updatedUser.subscriptionStatus,
        activeUntil: updatedUser.subscriptionEndDate,
      },
      note: 'Your subscription will remain active until the end of your billing period.',
    });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
