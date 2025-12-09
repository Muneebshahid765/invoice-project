"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { StatusChart } from '@/components/charts/StatusChart';
import { TopCustomersChart } from '@/components/charts/TopCustomersChart';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import Link from 'next/link';
import styles from './dashboard.module.css';

function DashboardContent() {
  const { user, logout, isAdmin, accessToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashboardRes, revenueRes, customerRes] = await Promise.all([
        fetch('/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/analytics/revenue?months=6', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/analytics/customers?limit=5', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setAnalytics(data);
      }
      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data.data || []);
      }
      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomerData(data.topCustomers || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const stats = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(analytics?.totalRevenue), 
      description: 'All time paid',
      icon: '💰',
      trend: analytics?.monthOverMonthGrowth,
    },
    { 
      title: 'This Month', 
      value: formatCurrency(analytics?.monthlyRevenue), 
      description: `vs ${formatCurrency(analytics?.lastMonthRevenue)} last month`,
      icon: '📈',
    },
    { 
      title: 'Pending', 
      value: formatCurrency(analytics?.pendingAmount), 
      description: `${analytics?.pendingCount || 0} invoices awaiting`,
      icon: '⏳',
    },
    { 
      title: 'Paid Invoices', 
      value: analytics?.paidCount || 0, 
      description: `${analytics?.paidPercentage || 0}% of total`,
      icon: '✅',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>📄</span>
            <span className={styles.logoText}>InvoiceSaaS</span>
          </Link>
        </div>
        <div className={styles.headerRight}>
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          )}
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={styles.avatarButton}>
                <Avatar>
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={styles.dropdownContent}>
              <DropdownMenuLabel>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.name}</span>
                  <span className={styles.userEmail}>{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/settings">
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </Link>
              <Link href="/pricing">
                <DropdownMenuItem>Billing</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className={styles.logoutItem}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className={styles.welcomeSubtitle}>
            Here&apos;s an overview of your invoicing activity.
          </p>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} className={styles.statCard}>
              <CardHeader className={styles.statHeader}>
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className={styles.statValue}>{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className={styles.statContent}>
                <p className={styles.statDescription}>{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={styles.actionsSection}>
          <Card className={styles.actionCard}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className={styles.actionButtons}>
              <Link href="/dashboard/invoices/new">
                <Button className={styles.actionButton}>
                  <span className={styles.actionIcon}>➕</span>
                  Create Invoice
                </Button>
              </Link>
              <Link href="/dashboard/invoices">
                <Button variant="outline" className={styles.actionButton}>
                  <span className={styles.actionIcon}>📄</span>
                  Manage Invoices
                </Button>
              </Link>
              <Link href="/dashboard/businesses">
                <Button variant="outline" className={styles.actionButton}>
                  <span className={styles.actionIcon}>🏢</span>
                  Manage Businesses
                </Button>
              </Link>
              <Link href="/dashboard/customers">
                <Button variant="outline" className={styles.actionButton}>
                  <span className={styles.actionIcon}>👥</span>
                  Manage Customers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className={styles.accountCard}>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your subscription information</CardDescription>
            </CardHeader>
            <CardContent className={styles.accountDetails}>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Plan</span>
                <span className={styles.accountValue}>
                  {user?.subscriptionPlan?.charAt(0).toUpperCase() + user?.subscriptionPlan?.slice(1) || 'Free'}
                </span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Role</span>
                <span className={styles.accountValue}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
                </span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Trial Ends</span>
                <span className={styles.accountValue}>
                  {formatDate(user?.trialEndDate)}
                </span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Member Since</span>
                <span className={styles.accountValue}>
                  {formatDate(user?.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          <RevenueChart data={revenueData} loading={loading} />
          <div className={styles.chartsRow}>
            <StatusChart data={analytics?.invoiceCounts} loading={loading} />
            <TopCustomersChart data={customerData} loading={loading} />
          </div>
        </div>

        {/* Overdue Alert */}
        {analytics?.overdueInvoices?.length > 0 && (
          <Alert className={styles.overdueAlert}>
            <AlertDescription className={styles.overdueContent}>
              <span>⚠️ You have {analytics.overdueInvoices.length} overdue invoice(s) requiring attention!</span>
              <Link href="/dashboard/invoices?status=OVERDUE">
                <Button size="sm" variant="destructive">View Overdue</Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Invoices & Upcoming Due */}
        <div className={styles.tablesSection}>
          <Card className={styles.recentCard}>
            <CardHeader className={styles.tableHeader}>
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your latest invoicing activity</CardDescription>
              </div>
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeletonList}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className={styles.skeletonRow} />
                  ))}
                </div>
              ) : analytics?.recentInvoices?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentInvoices.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Link href={`/dashboard/invoices/${invoice._id}`} className={styles.invoiceLink}>
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.customerId?.name || '-'}</TableCell>
                        <TableCell><StatusBadge status={invoice.status} /></TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📄</div>
                  <h3>No invoices yet</h3>
                  <p>Create your first invoice to get started</p>
                  <Link href="/dashboard/invoices/new">
                    <Button className={styles.emptyButton}>Create Invoice</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={styles.upcomingCard}>
            <CardHeader>
              <CardTitle>Upcoming Due</CardTitle>
              <CardDescription>Invoices due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeletonList}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className={styles.skeletonRow} />
                  ))}
                </div>
              ) : analytics?.upcomingDue?.length > 0 ? (
                <div className={styles.upcomingList}>
                  {analytics.upcomingDue.map((invoice) => (
                    <div key={invoice._id} className={styles.upcomingItem}>
                      <div className={styles.upcomingInfo}>
                        <Link href={`/dashboard/invoices/${invoice._id}`} className={styles.invoiceLink}>
                          {invoice.invoiceNumber}
                        </Link>
                        <span className={styles.upcomingCustomer}>{invoice.customerId?.name}</span>
                      </div>
                      <div className={styles.upcomingRight}>
                        <span className={styles.upcomingAmount}>{formatCurrency(invoice.total)}</span>
                        <span className={styles.upcomingDate}>Due {formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateSmall}>
                  <p>No invoices due soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Reports */}
        <div className={styles.bottomSection}>
          <Link href="/dashboard/reports">
            <Button variant="outline" className={styles.reportsButton}>
              📊 View Reports & Analytics
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
