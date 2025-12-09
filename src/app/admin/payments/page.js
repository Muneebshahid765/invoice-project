"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp, Download } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', plan: '', method: '' });

  useEffect(() => {
    if (accessToken) {
      fetchPayments();
    }
  }, [accessToken, pagination.page, filters]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setStats(data.stats);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = {
    COMPLETED: 'success',
    PENDING: 'warning',
    FAILED: 'destructive',
    REFUNDED: 'secondary',
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Payments & Billing</h1>
          <p className={styles.pageSubtitle}>View and manage all payments</p>
        </div>
        <Button variant="outline">
          <Download size={18} /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card>
          <CardContent className={styles.statContent}>
            <DollarSign size={32} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatCurrency(stats?.totalRevenue)}</span>
              <span className={styles.statTitle}>Total Revenue</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.statContent}>
            <CreditCard size={32} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats?.totalPayments || 0}</span>
              <span className={styles.statTitle}>Total Payments</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.statContent}>
            <TrendingUp size={32} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatCurrency(stats?.avgPayment)}</span>
              <span className={styles.statTitle}>Average Payment</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <div className={styles.filterGroup}>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              value={filters.plan}
              onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Plans</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <select
              value={filters.method}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Methods</option>
              <option value="STRIPE">Stripe</option>
              <option value="MANUAL">Manual</option>
              <option value="BANK">Bank Transfer</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : payments.length === 0 ? (
            <p className={styles.emptyText}>No payments found</p>
          ) : (
            <>
              <div className={styles.usersTableFull}>
                <div className={styles.tableHeaderFull} style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr' }}>
                  <span>ID</span>
                  <span>User</span>
                  <span>Plan</span>
                  <span>Amount</span>
                  <span>Method</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>

                {payments.map((payment) => (
                  <div 
                    key={payment._id} 
                    className={styles.tableRowFull}
                    style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1.5fr' }}
                  >
                    <span className={styles.paymentId}>
                      {payment._id.slice(-8).toUpperCase()}
                    </span>
                    <div>
                      <span className={styles.userName}>{payment.userId?.name || 'N/A'}</span>
                      <span className={styles.userEmail}>{payment.userId?.email || ''}</span>
                    </div>
                    <Badge>{payment.plan}</Badge>
                    <span className={styles.amount}>{formatCurrency(payment.amount)}</span>
                    <span>{payment.paymentMethod}</span>
                    <Badge variant={statusColors[payment.status] || 'secondary'}>
                      {payment.status}
                    </Badge>
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} payments
                </span>
                <div className={styles.paginationButtons}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
