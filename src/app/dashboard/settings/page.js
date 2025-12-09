"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import styles from './settings.module.css';

function SettingsContent() {
  const { user, accessToken, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    timezone: 'Asia/Karachi',
    language: 'en',
  });
  
  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    defaultBusinessId: '',
    defaultDueDays: 30,
    defaultTaxRate: 0,
    defaultCurrency: 'PKR',
    invoicePrefix: 'INV-',
    startingInvoiceNumber: 1,
    paymentTerms: '',
    bankDetails: '',
    defaultPdfTemplate: 'modern',
    brandColors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      text: '#1f2937',
    },
    invoiceFooter: '',
    termsAndConditions: '',
  });
  
  // Notifications state
  const [notifications, setNotifications] = useState({
    email: {
      invoiceCreated: true,
      paymentReceived: true,
      invoiceOverdue: true,
      customerViewed: false,
      weeklySummary: true,
    },
    reminders: {
      daysBeforeDue: 3,
      daysAfterDue: 7,
      frequency: 'once',
    },
  });

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    
    try {
      const [profileRes, settingsRes, notifRes, businessRes, subRes] = await Promise.all([
        fetch('/api/user/profile', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/settings/preferences', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/settings/notifications', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/businesses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/subscription', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile({
          name: data.user.name || '',
          phone: data.user.phone || '',
          timezone: data.user.timezone || 'Asia/Karachi',
          language: data.user.language || 'en',
        });
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }));
        }
      }

      if (businessRes.ok) {
        const data = await businessRes.json();
        setBusinesses(data.businesses || []);
      }

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Profile updated successfully', variant: 'success' });
        refreshUser?.();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(passwords),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Password changed successfully', variant: 'success' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Settings saved successfully', variant: 'success' });
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(notifications),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Notification settings saved', variant: 'success' });
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save notifications', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>Settings</span>
        </div>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className={styles.formContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                  <p className={styles.hint}>Email cannot be changed</p>
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Karachi">Pakistan (PKT)</SelectItem>
                      <SelectItem value="Asia/Dubai">UAE (GST)</SelectItem>
                      <SelectItem value="Europe/London">UK (GMT)</SelectItem>
                      <SelectItem value="America/New_York">US Eastern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="language">Language</Label>
                  <Select value={profile.language} onValueChange={(v) => setProfile({ ...profile, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          <Card className={styles.passwordCard}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className={styles.formContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={changePassword} disabled={saving} variant="outline">
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings Tab */}
        <TabsContent value="business" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Defaults</CardTitle>
              <CardDescription>Set default values for new invoices</CardDescription>
            </CardHeader>
            <CardContent className={styles.formContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label>Default Business</Label>
                  <Select 
                    value={settings.defaultBusinessId || ''} 
                    onValueChange={(v) => setSettings({ ...settings, defaultBusinessId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.formGroup}>
                  <Label>Default Due Days</Label>
                  <Select 
                    value={String(settings.defaultDueDays)} 
                    onValueChange={(v) => setSettings({ ...settings, defaultDueDays: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.formGroup}>
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultTaxRate}
                    onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Default Currency</Label>
                  <Select 
                    value={settings.defaultCurrency} 
                    onValueChange={(v) => setSettings({ ...settings, defaultCurrency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.formGroup}>
                  <Label>Invoice Number Prefix</Label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="INV-"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Starting Invoice Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.startingInvoiceNumber}
                    onChange={(e) => setSettings({ ...settings, startingInvoiceNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <Separator className={styles.separator} />

              <div className={styles.formGroup}>
                <Label>Payment Terms</Label>
                <Textarea
                  value={settings.paymentTerms}
                  onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                  placeholder="Payment is due within the specified due date..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <Label>Bank Details (for invoice footer)</Label>
                <Textarea
                  value={settings.bankDetails}
                  onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                  placeholder="Bank: HBL&#10;Account: 1234567890&#10;Title: Your Business Name"
                  rows={3}
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>PDF Template</CardTitle>
              <CardDescription>Customize your invoice appearance</CardDescription>
            </CardHeader>
            <CardContent className={styles.formContent}>
              <div className={styles.templateGrid}>
                {['modern', 'classic', 'minimal'].map((template) => (
                  <div
                    key={template}
                    className={`${styles.templateCard} ${settings.defaultPdfTemplate === template ? styles.templateSelected : ''}`}
                    onClick={() => setSettings({ ...settings, defaultPdfTemplate: template })}
                  >
                    <div className={styles.templatePreview}>
                      <span className={styles.templateIcon}>📄</span>
                    </div>
                    <span className={styles.templateName}>
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </span>
                    {settings.defaultPdfTemplate === template && (
                      <Badge className={styles.templateBadge}>Selected</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Separator className={styles.separator} />

              <h3 className={styles.sectionTitle}>Brand Colors</h3>
              <div className={styles.colorGrid}>
                <div className={styles.colorGroup}>
                  <Label>Primary Color</Label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={settings.brandColors?.primary || '#3b82f6'}
                      onChange={(e) => setSettings({
                        ...settings,
                        brandColors: { ...settings.brandColors, primary: e.target.value }
                      })}
                    />
                    <Input
                      value={settings.brandColors?.primary || '#3b82f6'}
                      onChange={(e) => setSettings({
                        ...settings,
                        brandColors: { ...settings.brandColors, primary: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className={styles.colorGroup}>
                  <Label>Secondary Color</Label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={settings.brandColors?.secondary || '#1e40af'}
                      onChange={(e) => setSettings({
                        ...settings,
                        brandColors: { ...settings.brandColors, secondary: e.target.value }
                      })}
                    />
                    <Input
                      value={settings.brandColors?.secondary || '#1e40af'}
                      onChange={(e) => setSettings({
                        ...settings,
                        brandColors: { ...settings.brandColors, secondary: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator className={styles.separator} />

              <div className={styles.formGroup}>
                <Label>Invoice Footer Text</Label>
                <Textarea
                  value={settings.invoiceFooter}
                  onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                  placeholder="Thank you for your business!"
                  rows={2}
                />
              </div>

              <div className={styles.formGroup}>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                  placeholder="1. Payment is due within the specified period..."
                  rows={4}
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Template Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose what emails you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.notificationList}>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationTitle}>Invoice Created</span>
                    <span className={styles.notificationDesc}>Get notified when a new invoice is created</span>
                  </div>
                  <Switch
                    checked={notifications.email?.invoiceCreated}
                    onCheckedChange={(v) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, invoiceCreated: v }
                    })}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationTitle}>Payment Received</span>
                    <span className={styles.notificationDesc}>Get notified when a payment is received</span>
                  </div>
                  <Switch
                    checked={notifications.email?.paymentReceived}
                    onCheckedChange={(v) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, paymentReceived: v }
                    })}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationTitle}>Invoice Overdue</span>
                    <span className={styles.notificationDesc}>Get notified when an invoice becomes overdue</span>
                  </div>
                  <Switch
                    checked={notifications.email?.invoiceOverdue}
                    onCheckedChange={(v) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, invoiceOverdue: v }
                    })}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationTitle}>Weekly Summary</span>
                    <span className={styles.notificationDesc}>Receive a weekly summary of your invoicing activity</span>
                  </div>
                  <Switch
                    checked={notifications.email?.weeklySummary}
                    onCheckedChange={(v) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, weeklySummary: v }
                    })}
                  />
                </div>
              </div>

              <Separator className={styles.separator} />

              <h3 className={styles.sectionTitle}>Payment Reminders</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label>Days Before Due Date</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={notifications.reminders?.daysBeforeDue || 3}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      reminders: { ...notifications.reminders, daysBeforeDue: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Days After Due Date</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={notifications.reminders?.daysAfterDue || 7}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      reminders: { ...notifications.reminders, daysAfterDue: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Reminder Frequency</Label>
                  <Select 
                    value={notifications.reminders?.frequency || 'once'} 
                    onValueChange={(v) => setNotifications({
                      ...notifications,
                      reminders: { ...notifications.reminders, frequency: v }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveNotifications} disabled={saving} className={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.planInfo}>
                <div className={styles.planHeader}>
                  <div>
                    <h3 className={styles.planName}>{subscription?.plan || 'FREE'}</h3>
                    <Badge variant={subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {subscription?.status || 'TRIAL'}
                    </Badge>
                  </div>
                  <Link href="/pricing">
                    <Button>Upgrade Plan</Button>
                  </Link>
                </div>

                {subscription?.status === 'TRIAL' && subscription?.trialEndDate && (
                  <div className={styles.trialBanner}>
                    <span>Trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <Separator className={styles.separator} />

              <h3 className={styles.sectionTitle}>Usage This Month</h3>
              <div className={styles.usageGrid}>
                <div className={styles.usageItem}>
                  <div className={styles.usageHeader}>
                    <span>Invoices</span>
                    <span>{usage?.invoices?.used || 0} / {usage?.invoices?.limit === -1 ? '∞' : usage?.invoices?.limit}</span>
                  </div>
                  <Progress 
                    value={usage?.invoices?.limit === -1 ? 0 : usage?.invoices?.percentage || 0} 
                    className={styles.usageProgress}
                  />
                </div>
                <div className={styles.usageItem}>
                  <div className={styles.usageHeader}>
                    <span>Businesses</span>
                    <span>{usage?.businesses?.used || 0} / {usage?.businesses?.limit === -1 ? '∞' : usage?.businesses?.limit}</span>
                  </div>
                  <Progress 
                    value={usage?.businesses?.limit === -1 ? 0 : usage?.businesses?.percentage || 0} 
                    className={styles.usageProgress}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className={styles.tabContent}>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" disabled>Coming Soon</Button>
              </div>

              <Separator className={styles.separator} />

              <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                  <h4>Active Sessions</h4>
                  <p>Manage devices where you're logged in</p>
                </div>
                <Button variant="outline" disabled>View Sessions</Button>
              </div>

              <Separator className={styles.separator} />

              <div className={styles.dangerZone}>
                <h4 className={styles.dangerTitle}>Danger Zone</h4>
                <div className={styles.dangerItem}>
                  <div className={styles.dangerInfo}>
                    <span>Delete Account</span>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" disabled>Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
