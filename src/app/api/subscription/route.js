import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getPlanDetails, getPlanLimits } from '@/lib/subscriptionPlans';
import { getUsageStats, checkTrialExpiry } from '@/lib/subscriptionMiddleware';

// GET /api/subscription - Get current subscription details
export async function GET(request) {
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

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planDetails = getPlanDetails(user.subscriptionPlan);
    const limits = getPlanLimits(user.subscriptionPlan);
    const usage = await getUsageStats(decoded.userId);
    const trialStatus = await checkTrialExpiry(decoded.userId);

    return NextResponse.json({
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        paymentMethod: user.paymentMethod,
      },
      planDetails,
      limits,
      usage,
      trialStatus: {
        expired: trialStatus.expired,
        daysRemaining: trialStatus.daysRemaining,
        message: trialStatus.message,
      },
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
