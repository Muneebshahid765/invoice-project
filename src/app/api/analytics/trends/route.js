import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Business from '@/models/Business';
import { requireAuth, createAuthResponse } from '@/middleware/auth';

// GET /api/analytics/trends - Get business trends and insights
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
        averageInvoiceValue: 0,
        averagePaymentDays: 0,
        bestMonth: null,
        worstMonth: null,
        insights: [],
      }, { status: 200 });
    }

    const baseQuery = { businessId: { $in: businessIds }, isDeleted: false };

    // Average invoice value
    const avgInvoiceResult = await Invoice.aggregate([
      { $match: { ...baseQuery, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, avg: { $avg: '$total' }, count: { $sum: 1 } } },
    ]);

    const averageInvoiceValue = avgInvoiceResult[0]?.avg || 0;
    const totalInvoiceCount = avgInvoiceResult[0]?.count || 0;

    // Average payment time (days between invoice date and paid date)
    const paidInvoices = await Invoice.find({
      ...baseQuery,
      status: 'PAID',
      paidAt: { $exists: true },
    }).select('date paidAt').lean();

    let totalPaymentDays = 0;
    let paymentCount = 0;

    paidInvoices.forEach(inv => {
      if (inv.paidAt && inv.date) {
        const days = Math.ceil(
          (new Date(inv.paidAt).getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days >= 0) {
          totalPaymentDays += days;
          paymentCount++;
        }
      }
    });

    const averagePaymentDays = paymentCount > 0 ? Math.round(totalPaymentDays / paymentCount) : 0;

    // Best and worst performing months (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          ...baseQuery,
          status: 'PAID',
          paidAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const bestMonth = monthlyRevenue[0] || null;
    const worstMonth = monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1] : null;

    // Generate insights
    const insights = [];

    // Insight 1: Payment behavior
    if (averagePaymentDays > 30) {
      insights.push({
        type: 'warning',
        title: 'Slow Payments',
        message: `Average payment time is ${averagePaymentDays} days. Consider offering early payment discounts.`,
      });
    } else if (averagePaymentDays <= 14) {
      insights.push({
        type: 'success',
        title: 'Fast Payments',
        message: `Great! Your average payment time is only ${averagePaymentDays} days.`,
      });
    }

    // Insight 2: Overdue invoices
    const overdueCount = await Invoice.countDocuments({ ...baseQuery, status: 'OVERDUE' });
    if (overdueCount > 0) {
      insights.push({
        type: 'alert',
        title: 'Overdue Invoices',
        message: `You have ${overdueCount} overdue invoice(s). Follow up to improve cash flow.`,
      });
    }

    // Insight 3: Draft invoices
    const draftCount = await Invoice.countDocuments({ ...baseQuery, status: 'DRAFT' });
    if (draftCount > 3) {
      insights.push({
        type: 'info',
        title: 'Pending Drafts',
        message: `You have ${draftCount} draft invoices. Review and send them to get paid faster.`,
      });
    }

    // Insight 4: Revenue trend
    if (monthlyRevenue.length >= 2) {
      const recentMonths = monthlyRevenue.slice(0, 3);
      const avgRecent = recentMonths.reduce((sum, m) => sum + m.revenue, 0) / recentMonths.length;
      const olderMonths = monthlyRevenue.slice(-3);
      const avgOlder = olderMonths.reduce((sum, m) => sum + m.revenue, 0) / olderMonths.length;

      if (avgRecent > avgOlder * 1.2) {
        insights.push({
          type: 'success',
          title: 'Revenue Growing',
          message: 'Your recent revenue is trending upward. Keep up the good work!',
        });
      } else if (avgRecent < avgOlder * 0.8) {
        insights.push({
          type: 'warning',
          title: 'Revenue Declining',
          message: 'Recent revenue is lower than usual. Consider new marketing strategies.',
        });
      }
    }

    return NextResponse.json({
      averageInvoiceValue: Math.round(averageInvoiceValue),
      averagePaymentDays,
      totalInvoiceCount,
      bestMonth: bestMonth ? {
        period: bestMonth._id,
        revenue: bestMonth.revenue,
        invoices: bestMonth.count,
      } : null,
      worstMonth: worstMonth ? {
        period: worstMonth._id,
        revenue: worstMonth.revenue,
        invoices: worstMonth.count,
      } : null,
      monthlyRevenue: monthlyRevenue.map(m => ({
        period: m._id,
        revenue: m.revenue,
        invoices: m.count,
      })),
      insights,
    }, { status: 200 });
  } catch (error) {
    console.error('Trends analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
