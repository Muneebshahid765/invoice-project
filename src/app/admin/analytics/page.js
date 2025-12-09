"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Download, TrendingUp, Users, DollarSign, FileText } from 'lucide-react';
import styles from '../admin.module.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [invoiceStats, setInvoiceStats] = useState([]);

  useEffect(() => {
    if (accessToken) {
      fetchAnalytics();
    }
  }, [accessToken]);

  const fetchAnalytics = async () => {
    try {
      // Fetch dashboard data for analytics
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Generate sample data based on stats
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        setRevenueData(months.map((month, i) => ({
          month,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          payments: Math.floor(Math.random() * 20) + 5,
        })));

        setUserGrowth(months.map((month, i) => ({
          month,
          users: Math.floor(Math.random() * 50) + (i * 10),
          active: Math.floor(Math.random() * 40) + (i * 8),
        })));

        setPlanDistribution([
          { name: 'Free', value: data.stats?.totalUsers - (data.stats?.activeSubscriptions || 0), color: '#94a3b8' },
          { name: 'Basic', value: Math.floor((data.stats?.activeSubscriptions || 0) * 0.4), color: '#3b82f6' },
          { name: 'Pro', value: Math.floor((data.stats?.activeSubscriptions || 0) * 0.4), color: '#8b5cf6' },
          { name: 'Enterprise', value: Math.floor((data.stats?.activeSubscriptions || 0) * 0.2), color: '#ef4444' },
        ]);

        setInvoiceStats([
          { name: 'Paid', value: Math.floor((data.stats?.totalInvoices || 0) * 0.6), color: '#22c55e' },
          { name: 'Pending', value: Math.floor((data.stats?.totalInvoices || 0) * 0.2), color: '#eab308' },
          { name: 'Overdue', value: data.stats?.overdueInvoices || 0, color: '#ef4444' },
          { name: 'Draft', value: Math.floor((data.stats?.totalInvoices || 0) * 0.1), color: '#94a3b8' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Analytics & Reports</h1>
          <p className={styles.pageSubtitle}>Platform performance insights</p>
        </div>
        <Button variant="outline">
          <Download size={18} /> Export Report
        </Button>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Revenue Chart */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle className={styles.chartTitle}>
              <DollarSign size={20} /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle className={styles.chartTitle}>
              <Users size={20} /> User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle className={styles.chartTitle}>
              <TrendingUp size={20} /> Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle className={styles.chartTitle}>
              <FileText size={20} /> Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={invoiceStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {invoiceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
