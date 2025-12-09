"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, RefreshCw } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminLogsPage() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (accessToken) {
      fetchLogs();
    }
  }, [accessToken, filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Simulated logs - in production, fetch from /api/admin/logs
      const sampleLogs = [
        { id: 1, action: 'User Login', user: 'admin@example.com', type: 'auth', status: 'success', ip: '192.168.1.1', time: new Date() },
        { id: 2, action: 'Invoice Created', user: 'user@example.com', type: 'invoice', status: 'success', ip: '192.168.1.2', time: new Date(Date.now() - 3600000) },
        { id: 3, action: 'Payment Received', user: 'user@example.com', type: 'payment', status: 'success', ip: '192.168.1.2', time: new Date(Date.now() - 7200000) },
        { id: 4, action: 'Failed Login Attempt', user: 'unknown@example.com', type: 'security', status: 'failed', ip: '10.0.0.1', time: new Date(Date.now() - 10800000) },
        { id: 5, action: 'Subscription Upgraded', user: 'user@example.com', type: 'subscription', status: 'success', ip: '192.168.1.2', time: new Date(Date.now() - 14400000) },
        { id: 6, action: 'User Registration', user: 'newuser@example.com', type: 'auth', status: 'success', ip: '192.168.1.5', time: new Date(Date.now() - 18000000) },
        { id: 7, action: 'Password Reset', user: 'user@example.com', type: 'security', status: 'success', ip: '192.168.1.2', time: new Date(Date.now() - 21600000) },
        { id: 8, action: 'Business Created', user: 'user@example.com', type: 'business', status: 'success', ip: '192.168.1.2', time: new Date(Date.now() - 25200000) },
      ];

      const filtered = filter === 'all' 
        ? sampleLogs 
        : sampleLogs.filter(log => log.type === filter);
      
      setLogs(filtered);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeColors = {
    auth: 'default',
    invoice: 'primary',
    payment: 'success',
    security: 'destructive',
    subscription: 'warning',
    business: 'secondary',
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Activity Logs</h1>
          <p className={styles.pageSubtitle}>System activity and audit trail</p>
        </div>
        <div className={styles.buttonGroup}>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw size={18} /> Refresh
          </Button>
          <Button variant="outline">
            <Download size={18} /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <div className={styles.filterGroup}>
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={filter === 'auth' ? 'default' : 'outline'}
              onClick={() => setFilter('auth')}
              size="sm"
            >
              Auth
            </Button>
            <Button 
              variant={filter === 'invoice' ? 'default' : 'outline'}
              onClick={() => setFilter('invoice')}
              size="sm"
            >
              Invoice
            </Button>
            <Button 
              variant={filter === 'payment' ? 'default' : 'outline'}
              onClick={() => setFilter('payment')}
              size="sm"
            >
              Payment
            </Button>
            <Button 
              variant={filter === 'security' ? 'default' : 'outline'}
              onClick={() => setFilter('security')}
              size="sm"
            >
              Security
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : logs.length === 0 ? (
            <p className={styles.emptyText}>No logs found</p>
          ) : (
            <div className={styles.usersTableFull}>
              <div className={styles.tableHeaderFull} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr' }}>
                <span>Action</span>
                <span>User</span>
                <span>Type</span>
                <span>Status</span>
                <span>IP Address</span>
                <span>Time</span>
              </div>

              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className={styles.tableRowFull}
                  style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr' }}
                >
                  <span className={styles.logAction}>{log.action}</span>
                  <span>{log.user}</span>
                  <Badge variant={typeColors[log.type] || 'secondary'}>
                    {log.type}
                  </Badge>
                  <Badge variant={log.status === 'success' ? 'success' : 'destructive'}>
                    {log.status}
                  </Badge>
                  <span className={styles.ipAddress}>{log.ip}</span>
                  <span>{formatDate(log.time)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
