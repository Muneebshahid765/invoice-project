"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { Save, Mail, CreditCard, Shield, Bell, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { accessToken } = useAuth();
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'InvoiceSaaS',
    siteUrl: 'https://invoicesaas.com',
    adminEmail: 'admin@invoicesaas.com',
    supportEmail: 'support@invoicesaas.com',
    timezone: 'Asia/Karachi',
    currency: 'PKR',
  });

  // Load security settings from backend
  useEffect(() => {
    const loadSecuritySettings = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch('/api/admin/settings/security', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const s = data.settings || {};
          setSecuritySettings({
            sessionTimeout: s.sessionTimeout ?? 30,
            maxLoginAttempts: s.maxLoginAttempts ?? 5,
            requireTwoFactor: !!s.requireTwoFactor,
            ipWhitelist: (s.ipWhitelist || []).join(', '),
          });
        }
      } catch (error) {
        console.error('Failed to load security settings', error);
      }
    };

    loadSecuritySettings();
  }, [accessToken]);

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'InvoiceSaaS',
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    ipWhitelist: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newUserNotification: true,
    paymentNotification: true,
    subscriptionExpiry: true,
    weeklyReport: true,
  });

  const handleSave = async (section) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Success', description: `${section} settings saved successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionTimeout: securitySettings.sessionTimeout,
          maxLoginAttempts: securitySettings.maxLoginAttempts,
          requireTwoFactor: securitySettings.requireTwoFactor,
          ipWhitelist: securitySettings.ipWhitelist,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save security settings',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Security settings saved successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save security settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Settings</h1>
          <p className={styles.pageSubtitle}>Configure platform settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className={styles.settingsTabs}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <Label>Site Name</Label>
                <Input
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <Label>Site URL</Label>
                <Input
                  value={generalSettings.siteUrl}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Admin Email</Label>
                  <Input
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Timezone</Label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className={styles.filterSelect}
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <Label>Default Currency</Label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className={styles.filterSelect}
                  >
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
              <Button onClick={() => handleSave('General')} disabled={saving}>
                <Save size={18} /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle><Mail size={20} /> Email Configuration</CardTitle>
              <CardDescription>SMTP and email settings</CardDescription>
            </CardHeader>
            <CardContent className={styles.settingsForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>SMTP Host</Label>
                  <Input
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>SMTP Port</Label>
                  <Input
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>SMTP Username</Label>
                  <Input
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>SMTP Password</Label>
                  <Input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>From Name</Label>
                  <Input
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <Button variant="outline">Test Email</Button>
                <Button onClick={() => handleSave('Email')} disabled={saving}>
                  <Save size={18} /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle><Shield size={20} /> Security Settings</CardTitle>
              <CardDescription>Authentication and security configuration</CardDescription>
            </CardHeader>
            <CardContent className={styles.settingsForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className={styles.switchItem}>
                <div>
                  <Label>Require Two-Factor Authentication</Label>
                  <p className={styles.switchDescription}>Enforce 2FA for all admin accounts</p>
                </div>
                <Switch
                  checked={securitySettings.requireTwoFactor}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireTwoFactor: checked }))}
                />
              </div>
              <div className={styles.formGroup}>
                <Label>IP Whitelist (comma separated)</Label>
                <Input
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  placeholder="192.168.1.1, 10.0.0.1"
                />
              </div>
              <Button onClick={handleSaveSecurity} disabled={saving}>
                <Save size={18} /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle><Bell size={20} /> Notification Settings</CardTitle>
              <CardDescription>Admin notification preferences</CardDescription>
            </CardHeader>
            <CardContent className={styles.settingsForm}>
              <div className={styles.switchItem}>
                <div>
                  <Label>New User Registration</Label>
                  <p className={styles.switchDescription}>Get notified when a new user registers</p>
                </div>
                <Switch
                  checked={notificationSettings.newUserNotification}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newUserNotification: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <Label>Payment Received</Label>
                  <p className={styles.switchDescription}>Get notified when a payment is received</p>
                </div>
                <Switch
                  checked={notificationSettings.paymentNotification}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentNotification: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <Label>Subscription Expiry Warning</Label>
                  <p className={styles.switchDescription}>Get notified when subscriptions are about to expire</p>
                </div>
                <Switch
                  checked={notificationSettings.subscriptionExpiry}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, subscriptionExpiry: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <Label>Weekly Report</Label>
                  <p className={styles.switchDescription}>Receive weekly summary report via email</p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyReport}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReport: checked }))}
                />
              </div>
              <Button onClick={() => handleSave('Notification')} disabled={saving}>
                <Save size={18} /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle><CreditCard size={20} /> Billing & Payment</CardTitle>
              <CardDescription>Payment gateway configuration</CardDescription>
            </CardHeader>
            <CardContent className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <Label>Stripe Public Key</Label>
                <Input placeholder="pk_test_..." />
              </div>
              <div className={styles.formGroup}>
                <Label>Stripe Secret Key</Label>
                <Input type="password" placeholder="sk_test_..." />
              </div>
              <div className={styles.formGroup}>
                <Label>Stripe Webhook Secret</Label>
                <Input type="password" placeholder="whsec_..." />
              </div>
              <div className={styles.formGroup}>
                <Label>Bank Account Details (for manual payments)</Label>
                <textarea
                  className={styles.textarea}
                  placeholder="Bank: HBL&#10;Account: 1234567890&#10;Title: Invoice SaaS"
                  rows={4}
                />
              </div>
              <Button onClick={() => handleSave('Billing')} disabled={saving}>
                <Save size={18} /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
