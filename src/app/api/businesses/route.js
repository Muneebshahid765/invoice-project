import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { businessSchema } from '@/lib/validations/business';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/businesses - Get user's businesses
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;

    await dbConnect();

    const businesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ businesses }, { status: 200 });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create a new business
export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const body = await request.json();

    // Validate input
    const validationResult = businessSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check plan limits (free plan: 1 business, basic: 3, pro: 10, enterprise: unlimited)
    const businessCount = await Business.countDocuments({
      userId: user._id,
      isDeleted: false,
    });

    const planLimits = {
      free: 1,
      basic: 3,
      pro: 10,
      enterprise: Infinity,
    };

    const limit = planLimits[user.subscriptionPlan] || 1;

    if (businessCount >= limit) {
      return NextResponse.json(
        { 
          error: `You have reached the maximum number of businesses (${limit}) for your plan. Please upgrade to add more.` 
        },
        { status: 403 }
      );
    }

    // Create business
    const business = await Business.create({
      ...validationResult.data,
      userId: user._id,
    });

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'BUSINESS_CREATED',
      entityType: 'business',
      entityId: business._id,
      details: { businessName: business.businessName },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Business created successfully', business },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
