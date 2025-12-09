"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, FileText, Users } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminBusinessesPage() {
  const { accessToken } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchBusinesses();
    }
  }, [accessToken]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/businesses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Businesses</h1>
          <p className={styles.pageSubtitle}>All registered businesses</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.secondaryStats}>
        <Card>
          <CardContent className={styles.miniStat}>
            <Building2 size={20} />
            <div>
              <span className={styles.miniStatValue}>{businesses.length}</span>
              <span className={styles.miniStatLabel}>Total Businesses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <div className={styles.searchForm}>
            <div className={styles.searchInput}>
              <Search size={18} />
              <Input
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <p className={styles.emptyText}>No businesses found</p>
          ) : (
            <div className={styles.usersTableFull}>
              <div className={styles.tableHeaderFull} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
                <span>Business</span>
                <span>Owner</span>
                <span>Invoices</span>
                <span>Customers</span>
                <span>Revenue</span>
                <span>Created</span>
              </div>

              {filteredBusinesses.map((business) => (
                <div 
                  key={business._id} 
                  className={styles.tableRowFull}
                  style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}
                >
                  <div>
                    <span className={styles.userName}>{business.name}</span>
                    <span className={styles.userEmail}>{business.email}</span>
                  </div>
                  <span>{business.userId?.name || 'N/A'}</span>
                  <span>{business.invoiceCount || 0}</span>
                  <span>{business.customerCount || 0}</span>
                  <span>{formatCurrency(business.totalRevenue)}</span>
                  <span>{formatDate(business.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
