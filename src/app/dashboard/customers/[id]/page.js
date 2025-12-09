"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import styles from './customer-detail.module.css';

function CustomerDetailContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
    },
  });

  useEffect(() => {
    fetchCustomer();
  }, [id, accessToken]);

  const fetchCustomer = async () => {
    if (!accessToken || !id) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setFormData({
          name: data.customer.name || '',
          email: data.customer.email || '',
          phone: data.customer.phone || '',
          notes: data.customer.notes || '',
          address: {
            street: data.customer.address?.street || '',
            city: data.customer.address?.city || '',
            state: data.customer.address?.state || '',
            postalCode: data.customer.address?.postalCode || '',
            country: data.customer.address?.country || 'Pakistan',
          },
        });
      } else {
        toast({
          title: 'Error',
          description: 'Customer not found',
          variant: 'destructive',
        });
        router.push('/dashboard/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
          variant: 'success',
        });
        setCustomer(data.customer);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update customer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/customers" className={styles.breadcrumbLink}>
            Customers
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>{customer?.name}</span>
        </div>
        <h1 className={styles.title}>{customer?.name}</h1>
        {customer?.businessId && (
          <p className={styles.businessName}>
            Business: {customer.businessId.businessName}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Update the customer details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>Address</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="address.state">State/Province</Label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  placeholder="State/Province"
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="address.postalCode">Postal Code</Label>
                <Input
                  id="address.postalCode"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal Code"
                />
              </div>
              <div className={styles.formGroup}>
                <Label htmlFor="address.country">Country</Label>
                <Input
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="address.street">Street Address</Label>
              <Textarea
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                placeholder="Enter street address"
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this customer"
                rows={3}
              />
            </div>

            <div className={styles.formActions}>
              <Link href="/dashboard/customers">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerDetailPage({ params }) {
  return (
    <ProtectedRoute>
      <CustomerDetailContent params={params} />
    </ProtectedRoute>
  );
}
