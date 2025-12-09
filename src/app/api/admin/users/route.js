import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Business from '@/models/Business';
import Invoice from '@/models/Invoice';

// GET /api/admin/users - Get all users with pagination
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (plan) query.subscriptionPlan = plan;
    if (status) query.subscriptionStatus = status;
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password'),
      User.countDocuments(query),
    ]);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [businessCount, invoiceCount, totalRevenue] = await Promise.all([
          Business.countDocuments({ userId: user._id }),
          Invoice.countDocuments({ userId: user._id }),
          Invoice.aggregate([
            { $match: { userId: user._id, status: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ]),
        ]);

        return {
          ...user.toObject(),
          businessCount,
          invoiceCount,
          totalRevenue: totalRevenue[0]?.total || 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password, role, subscriptionPlan } = body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      subscriptionPlan: subscriptionPlan || 'FREE',
      subscriptionStatus: 'ACTIVE',
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
