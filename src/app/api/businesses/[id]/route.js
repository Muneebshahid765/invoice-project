import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { updateBusinessSchema } from '@/lib/validations/business';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/businesses/[id] - Get single business
export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const business = await Business.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ business }, { status: 200 });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/businesses/[id] - Update business
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateBusinessSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const business = await Business.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Update fields
    Object.assign(business, validationResult.data);
    await business.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'BUSINESS_UPDATED',
      entityType: 'business',
      entityId: business._id,
      details: { businessName: business.businessName, updatedFields: Object.keys(validationResult.data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Business updated successfully', business },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/businesses/[id] - Soft delete business
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const business = await Business.findOne({
      _id: id,
      userId: user._id,
      isDeleted: false,
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Soft delete
    business.isDeleted = true;
    business.isActive = false;
    await business.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'BUSINESS_DELETED',
      entityType: 'business',
      entityId: business._id,
      details: { businessName: business.businessName },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Business deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
