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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import styles from './business-detail.module.css';

function BusinessDetailContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    currency: 'PKR',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
    },
  });

  useEffect(() => {
    fetchBusiness();
  }, [id, accessToken]);

  const fetchBusiness = async () => {
    if (!accessToken || !id) return;

    try {
      const response = await fetch(`/api/businesses/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
        setFormData({
          businessName: data.business.businessName || '',
          email: data.business.email || '',
          phone: data.business.phone || '',
          currency: data.business.currency || 'PKR',
          taxId: data.business.taxId || '',
          address: {
            street: data.business.address?.street || '',
            city: data.business.address?.city || '',
            state: data.business.address?.state || '',
            postalCode: data.business.address?.postalCode || '',
            country: data.business.address?.country || 'Pakistan',
          },
        });
      } else {
        toast({
          title: 'Error',
          description: 'Business not found',
          variant: 'destructive',
        });
        router.push('/dashboard/businesses');
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business',
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

  const handleCurrencyChange = (value) => {
    setFormData(prev => ({ ...prev, currency: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/businesses/${id}`, {
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
          description: 'Business updated successfully',
          variant: 'success',
        });
        setBusiness(data.business);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update business',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating business:', error);
      toast({
        title: 'Error',
        description: 'Failed to update business',
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
          <Link href="/dashboard/businesses" className={styles.breadcrumbLink}>
            Businesses
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>{business?.businessName}</span>
        </div>
        <h1 className={styles.title}>{business?.businessName}</h1>
      </div>

      <Tabs defaultValue="details" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Enter business name"
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
                      placeholder="business@example.com"
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
                  <div className={styles.formGroup}>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                        <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      placeholder="NTN/STRN number"
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

                <div className={styles.formActions}>
                  <Link href="/dashboard/businesses">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure additional settings for this business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.settingsInfo}>
                <p>Additional settings will be available here in future updates.</p>
                <ul>
                  <li>Invoice templates</li>
                  <li>Payment methods</li>
                  <li>Email notifications</li>
                  <li>Tax settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BusinessDetailPage({ params }) {
  return (
    <ProtectedRoute>
      <BusinessDetailContent params={params} />
    </ProtectedRoute>
  );
}
