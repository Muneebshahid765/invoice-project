"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  CreditCard, 
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminSubscriptionsPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (accessToken) {
      fetchSubscriptions();
    }
  }, [accessToken, filter]);

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        
        // Calculate stats
        const activeCount = data.users.filter(u => u.subscriptionStatus === 'ACTIVE' && u.subscriptionPlan !== 'FREE').length;
        const trialCount = data.users.filter(u => u.subscriptionStatus === 'TRIAL').length;
        const expiredCount = data.users.filter(u => u.subscriptionStatus === 'EXPIRED').length;
        
        setStats({
          active: activeCount,
          trial: trialCount,
          expired: expiredCount,
          total: data.users.length,
        });
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const planColors = {
    FREE: 'secondary',
    BASIC: 'default',
    PRO: 'primary',
    ENTERPRISE: 'destructive',
  };

  const statusColors = {
    ACTIVE: 'success',
    TRIAL: 'warning',
    EXPIRED: 'destructive',
    CANCELLED: 'secondary',
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Subscriptions</h1>
          <p className={styles.pageSubtitle}>Manage user subscriptions</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card>
          <CardContent className={styles.statContent}>
            <CreditCard size={32} style={{ color: 'hsl(var(--primary))' }} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats?.active || 0}</span>
              <span className={styles.statTitle}>Active Subscriptions</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.statContent}>
            <Calendar size={32} style={{ color: 'hsl(var(--warning, 38 92% 50%))' }} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats?.trial || 0}</span>
              <span className={styles.statTitle}>On Trial</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.statContent}>
            <AlertTriangle size={32} style={{ color: 'hsl(var(--destructive))' }} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats?.expired || 0}</span>
              <span className={styles.statTitle}>Expired</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.statContent}>
            <Users size={32} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats?.total || 0}</span>
              <span className={styles.statTitle}>Total Users</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <div className={styles.filterGroup}>
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'ACTIVE' ? 'default' : 'outline'}
              onClick={() => setFilter('ACTIVE')}
            >
              Active
            </Button>
            <Button 
              variant={filter === 'TRIAL' ? 'default' : 'outline'}
              onClick={() => setFilter('TRIAL')}
            >
              Trial
            </Button>
            <Button 
              variant={filter === 'EXPIRED' ? 'default' : 'outline'}
              onClick={() => setFilter('EXPIRED')}
            >
              Expired
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <div className={styles.usersTableFull}>
              <div className={styles.tableHeaderFull} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                <span>User</span>
                <span>Plan</span>
                <span>Status</span>
                <span>Start Date</span>
                <span>End Date</span>
                <span>Days Left</span>
              </div>

              {users.map((user) => {
                const daysRemaining = getDaysRemaining(user.subscriptionEndDate || user.trialEndDate);
                return (
                  <div 
                    key={user._id} 
                    className={styles.tableRowFull}
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
                  >
                    <div className={styles.userCell}>
                      <Avatar className={styles.tableAvatar}>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                    <Badge variant={planColors[user.subscriptionPlan] || 'secondary'}>
                      {user.subscriptionPlan}
                    </Badge>
                    <Badge variant={statusColors[user.subscriptionStatus] || 'secondary'}>
                      {user.subscriptionStatus}
                    </Badge>
                    <span>{formatDate(user.subscriptionStartDate || user.trialStartDate)}</span>
                    <span>{formatDate(user.subscriptionEndDate || user.trialEndDate)}</span>
                    <span className={daysRemaining <= 7 ? styles.warningText : ''}>
                      {daysRemaining !== null ? (
                        daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'
                      ) : 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
