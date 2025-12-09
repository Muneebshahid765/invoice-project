import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Business from '@/models/Business';
import Invoice from '@/models/Invoice';
import { getPlanLimits } from '@/lib/subscriptionPlans';

// GET /api/admin/users/[id] - Get single user details
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const user = await User.findById(params.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [businesses, invoices, invoiceStats] = await Promise.all([
      Business.find({ userId: user._id }),
      Invoice.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10),
      Invoice.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),
    ]);

    return NextResponse.json({
      user,
      businesses,
      recentInvoices: invoices,
      invoiceStats,
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, role, subscriptionPlan, subscriptionStatus } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (subscriptionPlan) {
      updateData.subscriptionPlan = subscriptionPlan;
      const limits = getPlanLimits(subscriptionPlan);
      updateData.invoiceLimit = limits.invoicesPerMonth;
      updateData.businessLimit = limits.businesses;
    }
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

    const user = await User.findByIdAndUpdate(
      params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    // Prevent deleting self
    if (params.id === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user's data
    await Promise.all([
      Business.deleteMany({ userId: params.id }),
      Invoice.deleteMany({ userId: params.id }),
      User.findByIdAndDelete(params.id),
    ]);

    return NextResponse.json({
      message: 'User and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
