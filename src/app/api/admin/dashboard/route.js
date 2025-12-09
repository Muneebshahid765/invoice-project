import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Business from '@/models/Business';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get counts
    const [
      totalUsers,
      usersLastMonth,
      activeSubscriptions,
      subscriptionsLastMonth,
      totalBusinesses,
      totalInvoices,
      invoicesLastMonth,
      newUsersToday,
      trialUsers,
      overdueInvoices,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $lt: startOfMonth, $gte: startOfLastMonth } }),
      User.countDocuments({ subscriptionStatus: 'ACTIVE', subscriptionPlan: { $ne: 'FREE' } }),
      User.countDocuments({ 
        subscriptionStatus: 'ACTIVE', 
        subscriptionPlan: { $ne: 'FREE' },
        subscriptionStartDate: { $lt: startOfMonth, $gte: startOfLastMonth }
      }),
      Business.countDocuments(),
      Invoice.countDocuments(),
      Invoice.countDocuments({ createdAt: { $lt: startOfMonth, $gte: startOfLastMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.countDocuments({ subscriptionStatus: 'TRIAL' }),
      Invoice.countDocuments({ status: 'OVERDUE' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role subscriptionPlan createdAt'),
    ]);

    // Calculate revenue
    let monthlyRevenue = 0;
    let lastMonthRevenue = 0;
    try {
      const revenueStats = await Payment.aggregate([
        { $match: { status: 'COMPLETED', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      monthlyRevenue = revenueStats[0]?.total || 0;

      const lastMonthStats = await Payment.aggregate([
        { $match: { status: 'COMPLETED', paidAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      lastMonthRevenue = lastMonthStats[0]?.total || 0;
    } catch (e) {
      // Payment model might not exist yet
    }

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 
      ? Math.round(((totalUsers - usersLastMonth) / usersLastMonth) * 100) 
      : 100;
    const subscriptionGrowth = subscriptionsLastMonth > 0 
      ? Math.round(((activeSubscriptions - subscriptionsLastMonth) / subscriptionsLastMonth) * 100) 
      : 100;
    const invoiceGrowth = invoicesLastMonth > 0 
      ? Math.round(((totalInvoices - invoicesLastMonth) / invoicesLastMonth) * 100) 
      : 100;
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
      : 100;

    // Recent activity (placeholder - would come from ActivityLog model)
    const recentActivity = [
      { action: 'New user registered', time: new Date(), icon: '👤' },
      { action: 'Payment received', time: new Date(Date.now() - 3600000), icon: '💰' },
      { action: 'Invoice created', time: new Date(Date.now() - 7200000), icon: '📄' },
    ];

    return NextResponse.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        monthlyRevenue,
        totalInvoices,
        totalBusinesses,
        newUsersToday,
        trialUsers,
        overdueInvoices,
        userGrowth,
        subscriptionGrowth,
        invoiceGrowth,
        revenueGrowth,
      },
      recentUsers,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
