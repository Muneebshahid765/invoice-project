"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import styles from './invoice-detail.module.css';

function InvoiceDetailContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState('modern');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      } else {
        toast({ title: 'Error', description: 'Invoice not found', variant: 'destructive' });
        router.push('/dashboard/invoices');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({ title: 'Error', description: 'Failed to load invoice', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, id, router, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        toast({ title: 'Success', description: `Invoice marked as ${newStatus}`, variant: 'success' });
        setStatusDialogOpen(false);
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Invoice deleted', variant: 'success' });
        router.push('/dashboard/invoices');
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Success', description: 'Invoice duplicated', variant: 'success' });
        router.push(`/dashboard/invoices/${data.invoice._id}`);
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate invoice', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const { generateInvoicePDF } = await import('@/lib/pdfGenerator');
      
      const doc = generateInvoicePDF(invoice, invoice.businessId, invoice.customerId, pdfTemplate);
      doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
      
      toast({ title: 'Success', description: 'PDF downloaded successfully', variant: 'success' });
      setPdfDialogOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'PKR') => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton className={styles.headerSkeleton} />
        <Skeleton className={styles.contentSkeleton} />
      </div>
    );
  }

  if (!invoice) return null;

  const statusActions = [
    { status: 'DRAFT', label: 'Mark as Draft', show: invoice.status !== 'DRAFT' },
    { status: 'SENT', label: 'Mark as Sent', show: invoice.status === 'DRAFT' },
    { status: 'PAID', label: 'Mark as Paid', show: ['DRAFT', 'SENT', 'OVERDUE'].includes(invoice.status) },
    { status: 'CANCELLED', label: 'Cancel Invoice', show: invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' },
  ].filter(a => a.show);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <Link href="/dashboard/invoices" className={styles.breadcrumbLink}>Invoices</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span>{invoice.invoiceNumber}</span>
          </div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className={styles.subtitle}>
            Created on {formatDate(invoice.createdAt)} • {invoice.customerId?.name}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => setPdfDialogOpen(true)}>Download PDF</Button>
          <Button variant="outline" onClick={handlePrint}>Print</Button>
          <Button variant="outline" onClick={handleDuplicate}>Duplicate</Button>
          <Link href={`/dashboard/invoices/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          {statusActions.length > 0 && (
            <Button onClick={() => setStatusDialogOpen(true)}>
              Update Status
            </Button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Main Invoice Preview */}
        <div className={styles.mainSection}>
          <div className={styles.printArea}>
            <InvoicePreview
              invoice={invoice}
              business={invoice.businessId}
              customer={invoice.customerId}
              items={invoice.items}
              subtotal={invoice.subtotal}
              tax={invoice.tax}
              discount={invoice.discount}
              total={invoice.total}
              currency={invoice.businessId?.currency || 'PKR'}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className={styles.quickActions}>
              {invoice.status !== 'PAID' && (
                <Button className={styles.actionButton} onClick={() => handleStatusChange('PAID')}>
                  💰 Mark as Paid
                </Button>
              )}
              {invoice.status === 'DRAFT' && (
                <Button variant="outline" className={styles.actionButton} onClick={() => handleStatusChange('SENT')}>
                  📤 Send Invoice
                </Button>
              )}
              <Button variant="outline" className={styles.actionButton} onClick={handleDuplicate}>
                📋 Duplicate
              </Button>
              <Button variant="destructive" className={styles.actionButton} onClick={handleDelete}>
                🗑️ Delete
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Invoice Number</span>
                <span className={styles.detailValue}>{invoice.invoiceNumber}</span>
              </div>
              <Separator />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <StatusBadge status={invoice.status} />
              </div>
              <Separator />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Invoice Date</span>
                <span className={styles.detailValue}>{formatDate(invoice.date)}</span>
              </div>
              <Separator />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Due Date</span>
                <span className={styles.detailValue}>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidAt && (
                <>
                  <Separator />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Paid On</span>
                    <span className={styles.detailValue}>{formatDate(invoice.paidAt)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Amount</span>
                <span className={styles.detailValueLarge}>
                  {formatCurrency(invoice.total, invoice.businessId?.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>Customer</CardTitle>
            </CardHeader>
            <CardContent className={styles.customerInfo}>
              <p className={styles.customerName}>{invoice.customerId?.name}</p>
              {invoice.customerId?.email && (
                <p className={styles.customerDetail}>{invoice.customerId.email}</p>
              )}
              {invoice.customerId?.phone && (
                <p className={styles.customerDetail}>{invoice.customerId.phone}</p>
              )}
              {invoice.customerId?.address && (
                <p className={styles.customerDetail}>
                  {[
                    invoice.customerId.address.street,
                    invoice.customerId.address.city,
                    invoice.customerId.address.country
                  ].filter(Boolean).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>Activity</CardTitle>
            </CardHeader>
            <CardContent className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <p className={styles.timelineTitle}>Invoice Created</p>
                  <p className={styles.timelineDate}>{formatDate(invoice.createdAt)}</p>
                </div>
              </div>
              {invoice.status !== 'DRAFT' && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineTitle}>Invoice Sent</p>
                    <p className={styles.timelineDate}>{formatDate(invoice.updatedAt)}</p>
                  </div>
                </div>
              )}
              {invoice.paidAt && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.timelineDotSuccess}`} />
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineTitle}>Payment Received</p>
                    <p className={styles.timelineDate}>{formatDate(invoice.paidAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Choose a new status for invoice {invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.statusOptions}>
            {statusActions.map((action) => (
              <Button
                key={action.status}
                variant={selectedStatus === action.status ? 'default' : 'outline'}
                className={styles.statusOption}
                onClick={() => setSelectedStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleStatusChange(selectedStatus)} 
              disabled={!selectedStatus || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Download Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Invoice PDF</DialogTitle>
            <DialogDescription>
              Choose a template style for your PDF
            </DialogDescription>
          </DialogHeader>
          <div className={styles.pdfOptions}>
            <div className={styles.templateSelect}>
              <label className={styles.templateLabel}>Template Style</label>
              <Select value={pdfTemplate} onValueChange={setPdfTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern - Clean with accent colors</SelectItem>
                  <SelectItem value="classic">Classic - Traditional business style</SelectItem>
                  <SelectItem value="minimal">Minimal - Simple and clean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoiceDetailPage({ params }) {
  return (
    <ProtectedRoute>
      <InvoiceDetailContent params={params} />
    </ProtectedRoute>
  );
}
