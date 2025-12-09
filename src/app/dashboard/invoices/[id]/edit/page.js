"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ItemRow } from '@/components/invoice/ItemRow';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import styles from './edit-invoice.module.css';

function EditInvoiceContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({
    date: new Date(),
    dueDate: new Date(),
    items: [{ description: '', quantity: 1, price: 0, total: 0 }],
    taxRate: 0,
    discount: 0,
    discountType: 'fixed',
    notes: '',
    terms: '',
    status: 'DRAFT',
  });

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = formData.discountType === 'percentage' 
    ? (subtotal * formData.discount) / 100 
    : formData.discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * formData.taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const fetchInvoice = useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        setFormData({
          date: new Date(data.invoice.date),
          dueDate: new Date(data.invoice.dueDate),
          items: data.invoice.items.length > 0 ? data.invoice.items : [{ description: '', quantity: 1, price: 0, total: 0 }],
          taxRate: data.invoice.taxRate || 0,
          discount: data.invoice.discount || 0,
          discountType: data.invoice.discountType || 'fixed',
          notes: data.invoice.notes || '',
          terms: data.invoice.terms || '',
          status: data.invoice.status,
        });
        setSelectedBusiness(data.invoice.businessId);
        setSelectedCustomer(data.invoice.customerId);
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

  const fetchCustomers = useCallback(async (businessId) => {
    if (!accessToken || !businessId) return;
    try {
      const response = await fetch(`/api/customers?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    if (selectedBusiness?._id) {
      fetchCustomers(selectedBusiness._id);
    }
  }, [selectedBusiness, fetchCustomers]);

  const handleCustomerChange = (value) => {
    const customer = customers.find(c => c._id === value);
    setSelectedCustomer(customer);
  };

  const handleItemChange = (index, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? updatedItem : item),
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0, total: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const validItems = formData.items.filter(item => item.description && item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one valid item', variant: 'destructive' });
      return;
    }

    if (new Date(formData.dueDate) < new Date(formData.date)) {
      toast({ title: 'Error', description: 'Due date must be after invoice date', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        ...formData,
        customerId: selectedCustomer?._id,
        items: validItems,
      };

      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: 'Invoice updated successfully', variant: 'success' });
        router.push(`/dashboard/invoices/${id}`);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update invoice', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({ title: 'Error', description: 'Failed to update invoice', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
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

  const showWarning = invoice.status !== 'DRAFT';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/invoices" className={styles.breadcrumbLink}>Invoices</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href={`/dashboard/invoices/${id}`} className={styles.breadcrumbLink}>{invoice.invoiceNumber}</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>Edit</span>
        </div>
        <h1 className={styles.title}>Edit Invoice {invoice.invoiceNumber}</h1>
      </div>

      {showWarning && (
        <Alert className={styles.warning}>
          <AlertDescription>
            ⚠️ This invoice has already been sent. Changes may affect the customer's copy.
          </AlertDescription>
        </Alert>
      )}

      <div className={styles.content}>
        <div className={styles.formSection}>
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Update invoice information</CardDescription>
            </CardHeader>
            <CardContent className={styles.form}>
              <div className={styles.formGroup}>
                <Label>Business</Label>
                <Input value={selectedBusiness?.businessName || ''} disabled />
              </div>

              <div className={styles.formGroup}>
                <Label>Customer</Label>
                <Select value={selectedCustomer?._id || ''} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Invoice Date</Label>
                  <DatePicker 
                    value={formData.date} 
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Due Date</Label>
                  <DatePicker 
                    value={formData.dueDate} 
                    onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items.map((item, index) => (
                <ItemRow
                  key={index}
                  item={item}
                  index={index}
                  onChange={handleItemChange}
                  onRemove={removeItem}
                  currency={selectedBusiness?.currency || 'PKR'}
                  canRemove={formData.items.length > 1}
                />
              ))}
              <Button type="button" variant="outline" onClick={addItem} className={styles.addItemButton}>
                + Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Tax & Discount */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Discount</CardTitle>
            </CardHeader>
            <CardContent className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Discount</Label>
                  <div className={styles.discountRow}>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    />
                    <Select value={formData.discountType} onValueChange={(v) => setFormData(prev => ({ ...prev, discountType: v }))}>
                      <SelectTrigger className={styles.discountType}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className={styles.form}>
              <div className={styles.formGroup}>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <Label>Terms & Conditions</Label>
                <Textarea
                  placeholder="Payment terms..."
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href={`/dashboard/invoices/${id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className={styles.previewSection}>
          <div className={styles.previewSticky}>
            <h3 className={styles.previewTitle}>Preview</h3>
            <InvoicePreview
              invoice={{ ...invoice, ...formData }}
              business={selectedBusiness}
              customer={selectedCustomer}
              items={formData.items.filter(i => i.description)}
              subtotal={subtotal}
              tax={taxAmount}
              discount={discountAmount}
              total={total}
              currency={selectedBusiness?.currency || 'PKR'}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditInvoicePage({ params }) {
  return (
    <ProtectedRoute>
      <EditInvoiceContent params={params} />
    </ProtectedRoute>
  );
}
