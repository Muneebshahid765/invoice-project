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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import styles from './new-customer.module.css';

function NewCustomerContent() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessId: '',
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
    fetchBusinesses();
  }, [accessToken]);

  const fetchBusinesses = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/businesses', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
        if (data.businesses.length === 1) {
          setFormData(prev => ({ ...prev, businessId: data.businesses[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
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

  const handleBusinessChange = (value) => {
    setFormData(prev => ({ ...prev, businessId: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessId) {
      toast({
        title: 'Error',
        description: 'Please select a business',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
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
          description: 'Customer created successfully',
          variant: 'success',
        });
        router.push('/dashboard/customers');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create customer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard/customers" className={styles.breadcrumbLink}>
            Customers
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>New Customer</span>
        </div>
        <h1 className={styles.title}>Add New Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Enter the customer details. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="businessId">Business *</Label>
              <Select value={formData.businessId} onValueChange={handleBusinessChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business._id} value={business._id}>
                      {business.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {businesses.length === 0 && (
                <p className={styles.helperText}>
                  You need to <Link href="/dashboard/businesses" className={styles.link}>create a business</Link> first.
                </p>
              )}
            </div>

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
              <Button type="submit" disabled={isSubmitting || businesses.length === 0}>
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <ProtectedRoute>
      <NewCustomerContent />
    </ProtectedRoute>
  );
}
