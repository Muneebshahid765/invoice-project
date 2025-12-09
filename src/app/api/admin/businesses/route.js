import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import Business from '@/models/Business';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';

// GET /api/admin/businesses - Get all businesses
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    const businesses = await Business.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get stats for each business
    const businessesWithStats = await Promise.all(
      businesses.map(async (business) => {
        const [invoiceCount, customerCount, revenueStats] = await Promise.all([
          Invoice.countDocuments({ businessId: business._id }),
          Customer.countDocuments({ businessId: business._id }),
          Invoice.aggregate([
            { $match: { businessId: business._id, status: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ]),
        ]);

        return {
          ...business.toObject(),
          invoiceCount,
          customerCount,
          totalRevenue: revenueStats[0]?.total || 0,
        };
      })
    );

    const total = await Business.countDocuments();

    return NextResponse.json({
      businesses: businessesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin businesses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
