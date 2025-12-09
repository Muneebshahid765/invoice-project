import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import Customer from '@/models/Customer';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/analytics/dashboard - Get dashboard analytics
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    const businessIds = userBusinesses.map(b => b._id);

    if (businessIds.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingAmount: 0,
        paidCount: 0,
        invoiceCounts: { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 },
        recentInvoices: [],
        overdueInvoices: [],
        upcomingDue: [],
        monthOverMonthGrowth: 0,
        totalCustomers: 0,
        totalBusinesses: 0,
      }, { status: 200 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update overdue invoices
    await Invoice.updateMany(
      {
        businessId: { $in: businessIds },
        status: 'SENT',
        dueDate: { $lt: now },
        isDeleted: false,
      },
      { $set: { status: 'OVERDUE' } }
    );

    const baseQuery = { businessId: { $in: businessIds }, isDeleted: false };

    // Parallel queries for performance
    const [
      totalRevenueResult,
      monthlyRevenueResult,
      lastMonthRevenueResult,
      pendingResult,
      invoiceCountsByStatus,
      recentInvoices,
      overdueInvoices,
      upcomingDue,
      totalCustomers,
    ] = await Promise.all([
      // Total revenue (paid invoices)
      Invoice.aggregate([
        { $match: { ...baseQuery, status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // This month revenue
      Invoice.aggregate([
        { $match: { ...baseQuery, status: 'PAID', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Last month revenue
      Invoice.aggregate([
        { $match: { ...baseQuery, status: 'PAID', paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Pending amount (sent + overdue)
      Invoice.aggregate([
        { $match: { ...baseQuery, status: { $in: ['SENT', 'OVERDUE'] } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Invoice counts by status
      Invoice.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Recent invoices
      Invoice.find(baseQuery)
        .populate('customerId', 'name email')
        .populate('businessId', 'businessName currency')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Overdue invoices
      Invoice.find({ ...baseQuery, status: 'OVERDUE' })
        .populate('customerId', 'name email')
        .populate('businessId', 'businessName currency')
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
      // Upcoming due (next 7 days)
      Invoice.find({
        ...baseQuery,
        status: 'SENT',
        dueDate: { $gte: now, $lte: sevenDaysFromNow },
      })
        .populate('customerId', 'name email')
        .populate('businessId', 'businessName currency')
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
      // Total customers
      Customer.countDocuments({ businessId: { $in: businessIds }, isDeleted: false }),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
    const pendingAmount = pendingResult[0]?.total || 0;
    const pendingCount = pendingResult[0]?.count || 0;

    // Calculate month over month growth
    let monthOverMonthGrowth = 0;
    if (lastMonthRevenue > 0) {
      monthOverMonthGrowth = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (monthlyRevenue > 0) {
      monthOverMonthGrowth = 100;
    }

    // Format invoice counts
    const invoiceCounts = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };
    invoiceCountsByStatus.forEach(item => {
      const key = item._id.toLowerCase();
      if (invoiceCounts.hasOwnProperty(key)) {
        invoiceCounts[key] = item.count;
      }
    });

    const paidCount = invoiceCounts.paid;
    const totalInvoices = Object.values(invoiceCounts).reduce((a, b) => a + b, 0);
    const paidPercentage = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0;

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      pendingAmount,
      pendingCount,
      paidCount,
      paidPercentage: Math.round(paidPercentage),
      invoiceCounts,
      totalInvoices,
      recentInvoices,
      overdueInvoices,
      upcomingDue,
      monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 10) / 10,
      totalCustomers,
      totalBusinesses: businessIds.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
