"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { StatusChart } from '@/components/charts/StatusChart';
import { TopCustomersChart } from '@/components/charts/TopCustomersChart';
import Link from 'next/link';
import styles from './reports.module.css';

function ReportsContent() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);

  // Calculate date range based on preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = now;
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        end = now;
        break;
      case 'last12Months':
        start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        end = now;
        break;
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
    }

    return { start, end };
  }, [dateRange, startDate, endDate]);

  const fetchBusinesses = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('/api/businesses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  }, [accessToken]);

  const fetchReports = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      if (selectedBusiness !== 'all') params.append('businessId', selectedBusiness);
      if (start) params.append('startDate', start.toISOString());
      if (end) params.append('endDate', end.toISOString());

      const [dashboardRes, revenueRes, customerRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/analytics/revenue?${params}&groupBy=month`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/analytics/customers?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/analytics/trends?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboardData(data);
      }
      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data.data || []);
      }
      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomerData(data);
      }
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrendsData(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: 'Error', description: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedBusiness, getDateRange, toast]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const exportToCSV = (type) => {
    let headers, rows, filename;

    switch (type) {
      case 'revenue':
        headers = ['Period', 'Revenue', 'Invoices'];
        rows = revenueData.map(item => [item.period, item.revenue, item.invoices]);
        filename = 'revenue-report.csv';
        break;
      case 'customers':
        headers = ['Customer', 'Email', 'Total Revenue', 'Invoice Count'];
        rows = (customerData?.topCustomers || []).map(c => [c.name, c.email, c.totalRevenue, c.invoiceCount]);
        filename = 'customer-report.csv';
        break;
      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>Reports</span>
        </div>
        <h1 className={styles.title}>Reports & Analytics</h1>
        <p className={styles.subtitle}>Detailed insights into your business performance</p>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Business</label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="All Businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.businessName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisQuarter">This Quarter</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="last6Months">Last 6 Months</SelectItem>
                <SelectItem value="last12Months">Last 12 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateRange === 'custom' && (
            <>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Start Date</label>
                <DatePicker value={startDate} onChange={setStartDate} />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>End Date</label>
                <DatePicker value={endDate} onChange={setEndDate} />
              </div>
            </>
          )}
          <Button onClick={fetchReports} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card>
          <CardHeader className={styles.summaryHeader}>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className={styles.summaryValue}>
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(dashboardData?.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className={styles.summaryHeader}>
            <CardDescription>Avg. Invoice Value</CardDescription>
            <CardTitle className={styles.summaryValue}>
              {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(trendsData?.averageInvoiceValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className={styles.summaryHeader}>
            <CardDescription>Avg. Payment Time</CardDescription>
            <CardTitle className={styles.summaryValue}>
              {loading ? <Skeleton className="h-8 w-32" /> : `${trendsData?.averagePaymentDays || 0} days`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className={styles.summaryHeader}>
            <CardDescription>On-Time Payments</CardDescription>
            <CardTitle className={styles.summaryValue}>
              {loading ? <Skeleton className="h-8 w-32" /> : `${customerData?.paymentBehavior?.onTimePercentage || 0}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="revenue" className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="revenue">Revenue Report</TabsTrigger>
          <TabsTrigger value="customers">Customer Report</TabsTrigger>
          <TabsTrigger value="status">Status Report</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className={styles.tabContent}>
          <Card>
            <CardHeader className={styles.reportHeader}>
              <div>
                <CardTitle>Revenue Report</CardTitle>
                <CardDescription>Revenue breakdown by period</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV('revenue')}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} loading={loading} />
              
              {!loading && revenueData.length > 0 && (
                <div className={styles.tableWrapper}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.period}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{item.invoices}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className={styles.tabContent}>
          <Card>
            <CardHeader className={styles.reportHeader}>
              <div>
                <CardTitle>Customer Report</CardTitle>
                <CardDescription>Top customers by revenue</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV('customers')}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <TopCustomersChart data={customerData?.topCustomers || []} loading={loading} />
              
              {!loading && customerData?.topCustomers?.length > 0 && (
                <div className={styles.tableWrapper}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerData.topCustomers.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell className="text-right">{formatCurrency(customer.totalRevenue)}</TableCell>
                          <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Payment Behavior */}
              <div className={styles.behaviorSection}>
                <h3 className={styles.sectionTitle}>Payment Behavior</h3>
                <div className={styles.behaviorGrid}>
                  <Card>
                    <CardContent className={styles.behaviorCard}>
                      <span className={styles.behaviorLabel}>On-Time Payments</span>
                      <span className={styles.behaviorValue}>{customerData?.paymentBehavior?.onTime || 0}</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className={styles.behaviorCard}>
                      <span className={styles.behaviorLabel}>Late Payments</span>
                      <span className={styles.behaviorValue}>{customerData?.paymentBehavior?.late || 0}</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className={styles.behaviorCard}>
                      <span className={styles.behaviorLabel}>New Customers</span>
                      <span className={styles.behaviorValue}>{customerData?.newVsReturning?.new || 0}</span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className={styles.behaviorCard}>
                      <span className={styles.behaviorLabel}>Returning Customers</span>
                      <span className={styles.behaviorValue}>{customerData?.newVsReturning?.returning || 0}</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Report</CardTitle>
              <CardDescription>Breakdown of invoices by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.statusGrid}>
                <StatusChart data={dashboardData?.invoiceCounts} loading={loading} />
                <div className={styles.statusDetails}>
                  <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ background: '#9ca3af' }} />
                    <span className={styles.statusLabel}>Draft</span>
                    <span className={styles.statusCount}>{dashboardData?.invoiceCounts?.draft || 0}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ background: '#3b82f6' }} />
                    <span className={styles.statusLabel}>Sent</span>
                    <span className={styles.statusCount}>{dashboardData?.invoiceCounts?.sent || 0}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ background: '#22c55e' }} />
                    <span className={styles.statusLabel}>Paid</span>
                    <span className={styles.statusCount}>{dashboardData?.invoiceCounts?.paid || 0}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ background: '#ef4444' }} />
                    <span className={styles.statusLabel}>Overdue</span>
                    <span className={styles.statusCount}>{dashboardData?.invoiceCounts?.overdue || 0}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ background: '#6b7280' }} />
                    <span className={styles.statusLabel}>Cancelled</span>
                    <span className={styles.statusCount}>{dashboardData?.invoiceCounts?.cancelled || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Business Insights</CardTitle>
              <CardDescription>AI-powered recommendations for your business</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeletonList}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className={styles.skeletonInsight} />
                  ))}
                </div>
              ) : trendsData?.insights?.length > 0 ? (
                <div className={styles.insightsList}>
                  {trendsData.insights.map((insight, index) => (
                    <div key={index} className={`${styles.insightItem} ${styles[`insight${insight.type}`]}`}>
                      <div className={styles.insightIcon}>
                        {insight.type === 'success' && '✅'}
                        {insight.type === 'warning' && '⚠️'}
                        {insight.type === 'alert' && '🚨'}
                        {insight.type === 'info' && 'ℹ️'}
                      </div>
                      <div className={styles.insightContent}>
                        <h4 className={styles.insightTitle}>{insight.title}</h4>
                        <p className={styles.insightMessage}>{insight.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyInsights}>
                  <p>No insights available yet. Create more invoices to get personalized recommendations.</p>
                </div>
              )}

              {/* Best/Worst Month */}
              {trendsData?.bestMonth && (
                <div className={styles.monthsSection}>
                  <h3 className={styles.sectionTitle}>Performance Highlights</h3>
                  <div className={styles.monthsGrid}>
                    <Card className={styles.monthCard}>
                      <CardContent className={styles.monthContent}>
                        <span className={styles.monthLabel}>📈 Best Month</span>
                        <span className={styles.monthPeriod}>{trendsData.bestMonth.period}</span>
                        <span className={styles.monthRevenue}>{formatCurrency(trendsData.bestMonth.revenue)}</span>
                      </CardContent>
                    </Card>
                    {trendsData.worstMonth && trendsData.worstMonth.period !== trendsData.bestMonth.period && (
                      <Card className={styles.monthCard}>
                        <CardContent className={styles.monthContent}>
                          <span className={styles.monthLabel}>📉 Lowest Month</span>
                          <span className={styles.monthPeriod}>{trendsData.worstMonth.period}</span>
                          <span className={styles.monthRevenue}>{formatCurrency(trendsData.worstMonth.revenue)}</span>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}
