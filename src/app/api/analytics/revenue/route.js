import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/analytics/revenue - Get revenue analytics
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    const businessId = searchParams.get('businessId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'month'; // day, month, year
    const months = parseInt(searchParams.get('months') || '12', 10);

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    let businessIds = userBusinesses.map(b => b._id);

    if (businessId && businessIds.some(id => id.toString() === businessId)) {
      businessIds = [businessId];
    }

    if (businessIds.length === 0) {
      return NextResponse.json({ data: [], comparison: null }, { status: 200 });
    }

    // Calculate date range
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to last N months
      start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      end = now;
    }

    // Build aggregation based on groupBy
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
        break;
      case 'year':
        dateFormat = { $dateToString: { format: '%Y', date: '$paidAt' } };
        break;
      case 'month':
      default:
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$paidAt' } };
    }

    const baseQuery = {
      businessId: { $in: businessIds },
      status: 'PAID',
      paidAt: { $gte: start, $lte: end },
      isDeleted: false,
    };

    const revenueData = await Invoice.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get comparison data (previous period)
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime() - 1);

    const prevRevenueData = await Invoice.aggregate([
      {
        $match: {
          businessId: { $in: businessIds },
          status: 'PAID',
          paidAt: { $gte: prevStart, $lte: prevEnd },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentTotal = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const previousTotal = prevRevenueData[0]?.revenue || 0;
    const growthPercentage = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : currentTotal > 0 ? 100 : 0;

    // Format data for charts
    const formattedData = revenueData.map(item => ({
      period: item._id,
      revenue: item.revenue,
      invoices: item.count,
    }));

    return NextResponse.json({
      data: formattedData,
      summary: {
        currentTotal,
        previousTotal,
        growthPercentage: Math.round(growthPercentage * 10) / 10,
        invoiceCount: revenueData.reduce((sum, item) => sum + item.count, 0),
      },
      dateRange: { start, end },
    }, { status: 200 });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
