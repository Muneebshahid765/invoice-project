import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/invoices/stats - Get invoice statistics
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    let businessIds = userBusinesses.map(b => b._id);

    // Filter by specific business if provided
    if (businessId && businessIds.some(id => id.toString() === businessId)) {
      businessIds = [businessId];
    }

    // Update overdue invoices
    const now = new Date();
    await Invoice.updateMany(
      {
        businessId: { $in: businessIds },
        status: 'SENT',
        dueDate: { $lt: now },
        isDeleted: false,
      },
      { $set: { status: 'OVERDUE' } }
    );

    // Get statistics
    const baseQuery = {
      businessId: { $in: businessIds },
      isDeleted: false,
    };

    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      cancelledInvoices,
      revenueStats,
    ] = await Promise.all([
      Invoice.countDocuments(baseQuery),
      Invoice.countDocuments({ ...baseQuery, status: 'DRAFT' }),
      Invoice.countDocuments({ ...baseQuery, status: 'SENT' }),
      Invoice.countDocuments({ ...baseQuery, status: 'PAID' }),
      Invoice.countDocuments({ ...baseQuery, status: 'OVERDUE' }),
      Invoice.countDocuments({ ...baseQuery, status: 'CANCELLED' }),
      Invoice.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate revenue metrics
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let overdueRevenue = 0;

    revenueStats.forEach(stat => {
      totalRevenue += stat.total;
      if (stat._id === 'PAID') paidRevenue = stat.total;
      if (stat._id === 'SENT') pendingRevenue = stat.total;
      if (stat._id === 'OVERDUE') overdueRevenue = stat.total;
    });

    // Get this month's stats
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyStats = await Invoice.aggregate([
      {
        $match: {
          ...baseQuery,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    let monthlyRevenue = 0;
    let monthlyPaid = 0;
    let monthlyInvoices = 0;

    monthlyStats.forEach(stat => {
      monthlyRevenue += stat.total;
      monthlyInvoices += stat.count;
      if (stat._id === 'PAID') monthlyPaid = stat.total;
    });

    return NextResponse.json({
      stats: {
        total: {
          invoices: totalInvoices,
          draft: draftInvoices,
          sent: sentInvoices,
          paid: paidInvoices,
          overdue: overdueInvoices,
          cancelled: cancelledInvoices,
        },
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
          overdue: overdueRevenue,
        },
        monthly: {
          invoices: monthlyInvoices,
          revenue: monthlyRevenue,
          paid: monthlyPaid,
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
