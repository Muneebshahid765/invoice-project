"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Building2,
  AlertCircle,
  UserPlus,
  Send,
  BarChart3,
  Settings
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
    }
  }, [accessToken]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      change: stats?.subscriptionGrowth || 0,
      icon: CreditCard,
      color: 'green',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue),
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      change: stats?.invoiceGrowth || 0,
      icon: FileText,
      color: 'orange',
    },
  ];

  const planColors = {
    FREE: 'secondary',
    BASIC: 'default',
    PRO: 'primary',
    ENTERPRISE: 'destructive',
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          return (
            <Card key={index} className={styles.statCard}>
              <CardContent className={styles.statContent}>
                <div className={styles.statIcon} style={{ color: `var(--${stat.color})` }}>
                  <Icon size={32} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statTitle}>{stat.title}</span>
                  {stat.change !== undefined && (
                    <span className={`${styles.statChange} ${isPositive ? styles.positive : styles.negative}`}>
                      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(stat.change)}% vs last month
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className={styles.secondaryStats}>
        <Card>
          <CardContent className={styles.miniStat}>
            <Building2 size={20} />
            <div>
              <span className={styles.miniStatValue}>{stats?.totalBusinesses || 0}</span>
              <span className={styles.miniStatLabel}>Businesses</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.miniStat}>
            <Users size={20} />
            <div>
              <span className={styles.miniStatValue}>{stats?.newUsersToday || 0}</span>
              <span className={styles.miniStatLabel}>New Today</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.miniStat}>
            <CreditCard size={20} />
            <div>
              <span className={styles.miniStatValue}>{stats?.trialUsers || 0}</span>
              <span className={styles.miniStatLabel}>On Trial</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.miniStat}>
            <AlertCircle size={20} />
            <div>
              <span className={styles.miniStatValue}>{stats?.overdueInvoices || 0}</span>
              <span className={styles.miniStatLabel}>Overdue</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Activity */}
        <Card className={styles.activityCard}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ul className={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <li key={index} className={styles.activityItem}>
                    <span className={styles.activityIcon}>{activity.icon}</span>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityAction}>{activity.action}</span>
                      <span className={styles.activityTime}>{formatDate(activity.time)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className={styles.quickActionsCard}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className={styles.quickActions}>
            <Link href="/admin/users">
              <Button className={styles.quickAction}>
                <UserPlus size={18} /> Add User
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className={styles.quickAction}>
                <BarChart3 size={18} /> View Analytics
              </Button>
            </Link>
            <Link href="/admin/payments">
              <Button variant="outline" className={styles.quickAction}>
                <DollarSign size={18} /> View Payments
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className={styles.quickAction}>
                <Settings size={18} /> System Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Table */}
      <Card className={styles.usersCard}>
        <CardHeader className={styles.usersHeader}>
          <div>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className={styles.usersTable}>
            <div className={styles.tableHeader}>
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Plan</span>
              <span>Joined</span>
            </div>
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user._id} className={styles.tableRow}>
                  <div className={styles.userCell}>
                    <Avatar className={styles.tableAvatar}>
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                  <span>{user.email}</span>
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                  <Badge variant={planColors[user.subscriptionPlan] || 'secondary'}>
                    {user.subscriptionPlan}
                  </Badge>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
