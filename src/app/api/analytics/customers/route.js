import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import Customer from '@/models/Customer';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/analytics/customers - Get customer analytics
export async function GET(request) {
  try {
    const authResult = await requireAuth(request);
    const authError = createAuthResponse(authResult);
    if (authError) return authError;

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    await dbConnect();

    // Get user's businesses
    const userBusinesses = await Business.find({
      userId: user._id,
      isDeleted: false,
    }).select('_id');

    const businessIds = userBusinesses.map(b => b._id);

    if (businessIds.length === 0) {
      return NextResponse.json({
        topCustomers: [],
        paymentBehavior: { onTime: 0, late: 0 },
        newVsReturning: { new: 0, returning: 0 },
      }, { status: 200 });
    }

    const baseQuery = { businessId: { $in: businessIds }, isDeleted: false };

    // Top customers by revenue
    const topCustomers = await Invoice.aggregate([
      { $match: { ...baseQuery, status: 'PAID' } },
      {
        $group: {
          _id: '$customerId',
          totalRevenue: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: 1,
          name: '$customer.name',
          email: '$customer.email',
          totalRevenue: 1,
          invoiceCount: 1,
        },
      },
    ]);

    // Payment behavior analysis
    const now = new Date();
    const paidInvoices = await Invoice.find({
      ...baseQuery,
      status: 'PAID',
      paidAt: { $exists: true },
    }).select('dueDate paidAt').lean();

    let onTimeCount = 0;
    let lateCount = 0;

    paidInvoices.forEach(inv => {
      if (inv.paidAt && inv.dueDate) {
        if (new Date(inv.paidAt) <= new Date(inv.dueDate)) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      }
    });

    // New vs returning customers (based on invoice count)
    const customerInvoiceCounts = await Invoice.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$customerId',
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    const newCustomers = customerInvoiceCounts.filter(c => c.invoiceCount === 1).length;
    const returningCustomers = customerInvoiceCounts.filter(c => c.invoiceCount > 1).length;

    // Customer growth over time (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const customerGrowth = await Customer.aggregate([
      {
        $match: {
          businessId: { $in: businessIds },
          isDeleted: false,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      topCustomers,
      paymentBehavior: {
        onTime: onTimeCount,
        late: lateCount,
        onTimePercentage: paidInvoices.length > 0
          ? Math.round((onTimeCount / paidInvoices.length) * 100)
          : 0,
      },
      newVsReturning: {
        new: newCustomers,
        returning: returningCustomers,
      },
      customerGrowth: customerGrowth.map(item => ({
        period: item._id,
        customers: item.count,
      })),
    }, { status: 200 });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
