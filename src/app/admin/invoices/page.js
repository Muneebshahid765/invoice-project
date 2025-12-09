"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminInvoicesPage() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    if (accessToken) {
      fetchInvoices();
    }
  }, [accessToken, pagination.page, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/invoices?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
    });
  };

  const statusColors = {
    DRAFT: 'secondary',
    SENT: 'default',
    PAID: 'success',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageSubtitle}>All platform invoices</p>
        </div>
        <Button variant="outline">
          <Download size={18} /> Export
        </Button>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <div className={styles.searchForm}>
            <div className={styles.searchInput}>
              <Search size={18} />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : invoices.length === 0 ? (
            <p className={styles.emptyText}>No invoices found</p>
          ) : (
            <>
              <div className={styles.usersTableFull}>
                <div className={styles.tableHeaderFull} style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr' }}>
                  <span>Invoice #</span>
                  <span>Business</span>
                  <span>Customer</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Due Date</span>
                  <span>Created</span>
                </div>

                {invoices.map((invoice) => (
                  <div 
                    key={invoice._id} 
                    className={styles.tableRowFull}
                    style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr' }}
                  >
                    <span className={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
                    <span>{invoice.businessId?.name || 'N/A'}</span>
                    <span>{invoice.customerId?.name || invoice.customerName || 'N/A'}</span>
                    <span className={styles.amount}>{formatCurrency(invoice.total)}</span>
                    <Badge variant={statusColors[invoice.status] || 'secondary'}>
                      {invoice.status}
                    </Badge>
                    <span>{formatDate(invoice.dueDate)}</span>
                    <span>{formatDate(invoice.createdAt)}</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <span>
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
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
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
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
