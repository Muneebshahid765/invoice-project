import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

// GET /api/admin/payments - Get all payments with pagination
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
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';
    const method = searchParams.get('method') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [payments, total, stats] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: { status: 'COMPLETED' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalPayments: { $sum: 1 },
            avgPayment: { $avg: '$amount' },
          },
        },
      ]),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || { totalRevenue: 0, totalPayments: 0, avgPayment: 0 },
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/payments - Create manual payment
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { userId, plan, amount, paymentMethod, transactionId, description } = body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payment = await Payment.create({
      userId,
      plan,
      amount,
      currency: 'PKR',
      status: 'COMPLETED',
      paymentMethod: paymentMethod || 'MANUAL',
      transactionId,
      description,
      paidAt: new Date(),
    });

    return NextResponse.json({
      message: 'Payment created successfully',
      payment,
    });
  } catch (error) {
    console.error('Admin create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
