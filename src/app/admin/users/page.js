"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  UserPlus, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ plan: '', status: '', role: '' });

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken, pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        ...filters,
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'User deleted successfully' });
        fetchUsers();
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const handleSuspendUser = async (userId, suspend) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          subscriptionStatus: suspend ? 'SUSPENDED' : 'ACTIVE',
        }),
      });

      if (response.ok) {
        toast({ 
          title: 'Success', 
          description: `User ${suspend ? 'suspended' : 'activated'} successfully` 
        });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
    SUSPENDED: 'destructive',
    CANCELLED: 'secondary',
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users Management</h1>
          <p className={styles.pageSubtitle}>Manage all registered users</p>
        </div>
        <Button>
          <UserPlus size={18} /> Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent className={styles.filtersContent}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInput}>
              <Search size={18} />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className={styles.filterGroup}>
            <select
              value={filters.plan}
              onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Plans</option>
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <>
              <div className={styles.usersTableFull}>
                <div className={styles.tableHeaderFull}>
                  <span>User</span>
                  <span>Role</span>
                  <span>Plan</span>
                  <span>Status</span>
                  <span>Businesses</span>
                  <span>Invoices</span>
                  <span>Revenue</span>
                  <span>Joined</span>
                  <span>Actions</span>
                </div>

                {users.map((user) => (
                  <div key={user._id} className={styles.tableRowFull}>
                    <div className={styles.userCell}>
                      <Avatar className={styles.tableAvatar}>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge variant={planColors[user.subscriptionPlan] || 'secondary'}>
                      {user.subscriptionPlan}
                    </Badge>
                    <Badge variant={statusColors[user.subscriptionStatus] || 'secondary'}>
                      {user.subscriptionStatus}
                    </Badge>
                    <span>{user.businessCount || 0}</span>
                    <span>{user.invoiceCount || 0}</span>
                    <span>{formatCurrency(user.totalRevenue)}</span>
                    <span>{formatDate(user.createdAt)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye size={14} /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit size={14} /> Edit User
                        </DropdownMenuItem>
                        {user.subscriptionStatus === 'SUSPENDED' ? (
                          <DropdownMenuItem onClick={() => handleSuspendUser(user._id, false)}>
                            <CheckCircle size={14} /> Unblock Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleSuspendUser(user._id, true)}>
                            <Ban size={14} /> Block Account
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className={styles.deleteItem}
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
                </span>
                <div className={styles.paginationButtons}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
