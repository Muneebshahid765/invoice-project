import { NextResponse } from 'next/server';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    
    if (authError) {
      return authError;
    }

    const { user } = authResult;

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
          trialEndDate: user.trialEndDate,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
