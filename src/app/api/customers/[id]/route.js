import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';
import { updateCustomerSchema } from '@/lib/validations/customer';
import { logActivity, getRequestMeta } from '@/lib/activityLogger';

// GET /api/customers/[id] - Get single customer
export async function GET(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'businessName userId');

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    if (customer.businessId.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    await dbConnect();

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId');

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    if (customer.businessId.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update fields
    Object.assign(customer, validationResult.data);
    await customer.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'CUSTOMER_UPDATED',
      entityType: 'customer',
      entityId: customer._id,
      details: { customerName: customer.name, updatedFields: Object.keys(validationResult.data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Customer updated successfully', customer },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Soft delete customer
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { id } = params;

    await dbConnect();

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false,
    }).populate('businessId', 'userId');

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user owns the business
    if (customer.businessId.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Soft delete
    customer.isDeleted = true;
    await customer.save();

    // Log activity
    const { ipAddress, userAgent } = getRequestMeta(request);
    await logActivity({
      userId: user._id,
      action: 'CUSTOMER_DELETED',
      entityType: 'customer',
      entityId: customer._id,
      details: { customerName: customer.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
