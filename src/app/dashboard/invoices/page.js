"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceStats } from '@/components/invoice/InvoiceStats';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { DatePicker } from '@/components/ui/date-picker';
import Link from 'next/link';
import styles from './invoices.module.css';

function InvoicesContent() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  
  // Bulk selection
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

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

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBusiness !== 'all') params.append('businessId', selectedBusiness);
      
      const response = await fetch(`/api/invoices/stats?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken, selectedBusiness]);

  const fetchInvoices = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedBusiness !== 'all') params.append('businessId', selectedBusiness);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/invoices?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, pagination.page, pagination.limit, selectedBusiness, selectedStatus, search, startDate, endDate, toast]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Invoice marked as ${newStatus}`, variant: 'success' });
        fetchInvoices();
        fetchStats();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Invoice deleted', variant: 'success' });
        fetchInvoices();
        fetchStats();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (invoiceId) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Success', description: 'Invoice duplicated', variant: 'success' });
        fetchInvoices();
        fetchStats();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate invoice', variant: 'destructive' });
    }
  };

  const handleBulkAction = async () => {
    if (selectedInvoices.length === 0 || !bulkAction) return;

    try {
      const response = await fetch('/api/invoices/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action: bulkAction, invoiceIds: selectedInvoices }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Success', description: data.message, variant: 'success' });
        setSelectedInvoices([]);
        setBulkDialogOpen(false);
        fetchInvoices();
        fetchStats();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk operation failed', variant: 'destructive' });
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(i => i._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const headers = ['Invoice #', 'Customer', 'Business', 'Date', 'Due Date', 'Status', 'Total'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.customerId?.name || '',
      inv.businessId?.businessName || '',
      new Date(inv.date).toLocaleDateString(),
      new Date(inv.dueDate).toLocaleDateString(),
      inv.status,
      inv.total,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount, currency = 'PKR') => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Manage and track all your invoices</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={exportToCSV} disabled={invoices.length === 0}>
            Export CSV
          </Button>
          <Link href="/dashboard/invoices/new">
            <Button>Create Invoice</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <InvoiceStats stats={stats} loading={statsLoading} />

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
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
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Start Date" />
          <DatePicker value={endDate} onChange={setEndDate} placeholder="End Date" />
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <Card className={styles.bulkCard}>
          <CardContent className={styles.bulkActions}>
            <span>{selectedInvoices.length} selected</span>
            <div className={styles.bulkButtons}>
              <Button size="sm" variant="outline" onClick={() => { setBulkAction('markPaid'); setBulkDialogOpen(true); }}>
                Mark as Paid
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setBulkAction('markSent'); setBulkDialogOpen(true); }}>
                Mark as Sent
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setBulkAction('delete'); setBulkDialogOpen(true); }}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <CardContent className={styles.tableContainer}>
          {loading ? (
            <div className={styles.skeletonContainer}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📄</div>
              <h3>No invoices yet</h3>
              <p>Create your first invoice to get started</p>
              <Link href="/dashboard/invoices/new">
                <Button>Create Invoice</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.length === invoices.length}
                        onChange={toggleSelectAll}
                        className={styles.checkbox}
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className={styles.actionsColumn}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice._id)}
                          onChange={() => toggleSelect(invoice._id)}
                          className={styles.checkbox}
                        />
                      </TableCell>
                      <TableCell className={styles.invoiceNumber}>
                        <Link href={`/dashboard/invoices/${invoice._id}`}>
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customerId?.name || '-'}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell><StatusBadge status={invoice.status} /></TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total, invoice.businessId?.currency)}
                      </TableCell>
                      <TableCell>
                        <div className={styles.rowActions}>
                          <Link href={`/dashboard/invoices/${invoice._id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link href={`/dashboard/invoices/${invoice._id}/edit`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                          {invoice.status !== 'PAID' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(invoice._id, 'PAID')}>
                              Mark Paid
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(invoice._id)}>
                            Duplicate
                          </Button>
                          <Button variant="ghost" size="sm" className={styles.deleteButton} onClick={() => handleDelete(invoice._id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className={styles.pageInfo}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {bulkAction === 'markPaid' ? 'mark as paid' : bulkAction === 'markSent' ? 'mark as sent' : 'delete'} {selectedInvoices.length} invoice(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button variant={bulkAction === 'delete' ? 'destructive' : 'default'} onClick={handleBulkAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <InvoicesContent />
    </ProtectedRoute>
  );
}
