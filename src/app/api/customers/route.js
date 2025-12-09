import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { customerSchema } from '@/lib/validations/customer';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/customers - Get all customers (filtered by businessId)
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await dbConnect();

    // Build query
    const query = { isDeleted: false };

    if (businessId) {
      // Verify user owns this business
      const business = await Business.findOne({
        _id: businessId,
        userId: user._id,
        isDeleted: false,
      });

      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }

      query.businessId = businessId;
    } else {
      // Get all businesses for this user
      const userBusinesses = await Business.find({
        userId: user._id,
        isDeleted: false,
      }).select('_id');

      query.businessId = { $in: userBusinesses.map(b => b._id) };
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('businessId', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const body = await request.json();

    // Validate input
    const validationResult = customerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { businessId, ...customerData } = validationResult.data;

    await dbConnect();

    // Verify user owns this business
    const business = await Business.findOne({
      _id: businessId,
      userId: user._id,
      isDeleted: false,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Create customer
    const customer = await Customer.create({
      ...customerData,
      businessId,
    });

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'CUSTOMER_CREATED',
      entityType: 'customer',
      entityId: customer._id,
      details: { customerName: customer.name, businessId },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Customer created successfully', customer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
