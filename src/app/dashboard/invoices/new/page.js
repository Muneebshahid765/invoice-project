"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ItemRow } from '@/components/invoice/ItemRow';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import Link from 'next/link';
import styles from './new-invoice.module.css';

const STEPS = [
  { id: 1, title: 'Select Business & Customer' },
  { id: 2, title: 'Add Line Items' },
  { id: 3, title: 'Details & Terms' },
  { id: 4, title: 'Preview & Save' },
];

function NewInvoiceContent() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const autoSaveRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [businesses, setBusinesses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  const [formData, setFormData] = useState({
    businessId: '',
    customerId: '',
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [{ description: '', quantity: 1, price: 0, total: 0 }],
    taxRate: 0,
    discount: 0,
    discountType: 'fixed',
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
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

  const fetchBusinesses = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('/api/businesses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
        if (data.businesses.length === 1) {
          setFormData(prev => ({ ...prev, businessId: data.businesses[0]._id }));
          setSelectedBusiness(data.businesses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  }, [accessToken]);

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
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    if (formData.businessId) {
      fetchCustomers(formData.businessId);
      const business = businesses.find(b => b._id === formData.businessId);
      setSelectedBusiness(business);
    }
  }, [formData.businessId, businesses, fetchCustomers]);

  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c._id === formData.customerId);
      setSelectedCustomer(customer);
    }
  }, [formData.customerId, customers]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isDraft && formData.businessId && formData.customerId) {
      autoSaveRef.current = setInterval(() => {
        handleSave(true);
      }, 30000);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [isDraft, formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      }
      if (e.key === 'Escape') {
        if (confirm('Discard changes?')) {
          router.push('/dashboard/invoices');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleBusinessChange = (value) => {
    setFormData(prev => ({ ...prev, businessId: value, customerId: '' }));
    setSelectedCustomer(null);
  };

  const handleCustomerChange = (value) => {
    setFormData(prev => ({ ...prev, customerId: value }));
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.businessId) {
          toast({ title: 'Error', description: 'Please select a business', variant: 'destructive' });
          return false;
        }
        if (!formData.customerId) {
          toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        const validItems = formData.items.filter(item => item.description && item.quantity > 0 && item.price > 0);
        if (validItems.length === 0) {
          toast({ title: 'Error', description: 'Please add at least one valid item', variant: 'destructive' });
          return false;
        }
        return true;
      case 3:
        if (!formData.dueDate) {
          toast({ title: 'Error', description: 'Please set a due date', variant: 'destructive' });
          return false;
        }
        if (new Date(formData.dueDate) < new Date(formData.date)) {
          toast({ title: 'Error', description: 'Due date must be after invoice date', variant: 'destructive' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async (asDraft = false) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    setIsDraft(asDraft);

    try {
      // Filter and normalize items to ensure numeric quantity and price
      const validItems = formData.items
        .filter((item) => item.description && item.quantity > 0 && item.price > 0)
        .map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
        }));

      const invoiceData = {
        ...formData,
        status: asDraft ? 'DRAFT' : 'SENT',
        items: validItems,
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: asDraft ? 'Invoice saved as draft' : 'Invoice created and sent',
          variant: 'success',
        });
        router.push(`/dashboard/invoices/${data.invoice._id}`);
      } else {
        const firstErrorMessage = Array.isArray(data.details) && data.details[0]?.message
          ? data.details[0].message
          : data.error || 'Failed to create invoice';

        console.error('Create invoice validation error:', data);
        toast({ title: 'Error', description: firstErrorMessage, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/invoices" className={styles.breadcrumbLink}>Invoices</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>New Invoice</span>
        </div>
        <h1 className={styles.title}>Create New Invoice</h1>
      </div>

      {/* Progress Steps */}
      <div className={styles.steps}>
        {STEPS.map((step, index) => (
          <div 
            key={step.id} 
            className={`${styles.step} ${currentStep >= step.id ? styles.stepActive : ''} ${currentStep === step.id ? styles.stepCurrent : ''}`}
          >
            <div className={styles.stepNumber}>{step.id}</div>
            <span className={styles.stepTitle}>{step.title}</span>
            {index < STEPS.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      <div className={styles.content}>
        {/* Form Section */}
        <div className={styles.formSection}>
          {/* Step 1: Business & Customer */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Business & Customer</CardTitle>
                <CardDescription>Choose the business and customer for this invoice</CardDescription>
              </CardHeader>
              <CardContent className={styles.form}>
                <div className={styles.formGroup}>
                  <Label>Business *</Label>
                  <Select value={formData.businessId} onValueChange={handleBusinessChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {businesses.length === 0 && (
                    <p className={styles.helperText}>
                      <Link href="/dashboard/businesses" className={styles.link}>Create a business</Link> first
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <Label>Customer *</Label>
                  <Select value={formData.customerId} onValueChange={handleCustomerChange} disabled={!formData.businessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.businessId && customers.length === 0 && (
                    <p className={styles.helperText}>
                      <Link href="/dashboard/customers/new" className={styles.link}>Add a customer</Link> first
                    </p>
                  )}
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
                    <Label>Due Date *</Label>
                    <DatePicker 
                      value={formData.dueDate} 
                      onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Line Items */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Add Line Items</CardTitle>
                <CardDescription>Add products or services to the invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={styles.itemsHeader}>
                  <div className={styles.itemsHeaderGrid}>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                </div>
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
          )}

          {/* Step 3: Details & Terms */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Details & Terms</CardTitle>
                <CardDescription>Add tax, discount, notes and terms</CardDescription>
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

                <div className={styles.formGroup}>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes for the customer..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Payment terms and conditions..."
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview & Save</CardTitle>
                <CardDescription>Review your invoice before saving</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicePreview
                  invoice={formData}
                  business={selectedBusiness}
                  customer={selectedCustomer}
                  items={formData.items.filter(i => i.description)}
                  subtotal={subtotal}
                  tax={taxAmount}
                  discount={discountAmount}
                  total={total}
                  currency={selectedBusiness?.currency || 'PKR'}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className={styles.navigation}>
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>Previous</Button>
              )}
            </div>
            <div className={styles.navRight}>
              {currentStep < 4 ? (
                <Button onClick={nextStep}>Next</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleSave(true)} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button onClick={() => handleSave(false)} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create & Send'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className={styles.previewSection}>
          <div className={styles.previewSticky}>
            <h3 className={styles.previewTitle}>Live Preview</h3>
            <InvoicePreview
              invoice={formData}
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

export default function NewInvoicePage() {
  return (
    <ProtectedRoute>
      <NewInvoiceContent />
    </ProtectedRoute>
  );
}
