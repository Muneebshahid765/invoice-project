"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminSystemPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchSystemHealth();
    }
  }, [accessToken]);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      // Simulated system health data
      setSystemHealth({
        status: 'healthy',
        uptime: '15 days, 4 hours',
        lastCheck: new Date(),
        services: [
          { name: 'Web Server', status: 'operational', latency: '45ms' },
          { name: 'Database', status: 'operational', latency: '12ms' },
          { name: 'Cache (Redis)', status: 'operational', latency: '2ms' },
          { name: 'Email Service', status: 'operational', latency: '120ms' },
          { name: 'Payment Gateway', status: 'operational', latency: '200ms' },
          { name: 'File Storage', status: 'operational', latency: '85ms' },
        ],
        metrics: {
          cpu: 23,
          memory: 45,
          disk: 32,
          requests: 1250,
          errors: 3,
          avgResponseTime: 145,
        },
        recentIncidents: [],
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={16} className={styles.statusOperational} />;
      case 'degraded':
        return <AlertTriangle size={16} className={styles.statusDegraded} />;
      case 'down':
        return <XCircle size={16} className={styles.statusDown} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Checking system health...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>System Health</h1>
          <p className={styles.pageSubtitle}>
            Last checked: {systemHealth?.lastCheck?.toLocaleString()}
          </p>
        </div>
        <Button onClick={fetchSystemHealth}>
          <RefreshCw size={18} /> Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={styles.statusCard}>
        <CardContent className={styles.overallStatus}>
          <div className={styles.statusIndicator}>
            {systemHealth?.status === 'healthy' ? (
              <CheckCircle size={48} className={styles.statusOperational} />
            ) : (
              <AlertTriangle size={48} className={styles.statusDegraded} />
            )}
          </div>
          <div>
            <h2 className={styles.statusTitle}>
              {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
            </h2>
            <p className={styles.statusSubtitle}>Uptime: {systemHealth?.uptime}</p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <Card>
          <CardContent className={styles.metricCard}>
            <Cpu size={24} />
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>{systemHealth?.metrics.cpu}%</span>
              <span className={styles.metricLabel}>CPU Usage</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${systemHealth?.metrics.cpu}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.metricCard}>
            <Server size={24} />
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>{systemHealth?.metrics.memory}%</span>
              <span className={styles.metricLabel}>Memory Usage</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${systemHealth?.metrics.memory}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.metricCard}>
            <HardDrive size={24} />
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>{systemHealth?.metrics.disk}%</span>
              <span className={styles.metricLabel}>Disk Usage</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${systemHealth?.metrics.disk}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.metricCard}>
            <Activity size={24} />
            <div className={styles.metricInfo}>
              <span className={styles.metricValue}>{systemHealth?.metrics.avgResponseTime}ms</span>
              <span className={styles.metricLabel}>Avg Response Time</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Services Status</CardTitle>
          <CardDescription>Real-time status of all system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.servicesList}>
            {systemHealth?.services.map((service, index) => (
              <div key={index} className={styles.serviceItem}>
                <div className={styles.serviceInfo}>
                  {getStatusIcon(service.status)}
                  <span className={styles.serviceName}>{service.name}</span>
                </div>
                <div className={styles.serviceStatus}>
                  <span className={styles.serviceLatency}>{service.latency}</span>
                  <Badge variant={getStatusBadge(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className={styles.secondaryStats}>
        <Card>
          <CardContent className={styles.miniStat}>
            <Activity size={20} />
            <div>
              <span className={styles.miniStatValue}>{systemHealth?.metrics.requests}</span>
              <span className={styles.miniStatLabel}>Requests/hr</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.miniStat}>
            <AlertTriangle size={20} />
            <div>
              <span className={styles.miniStatValue}>{systemHealth?.metrics.errors}</span>
              <span className={styles.miniStatLabel}>Errors/hr</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
