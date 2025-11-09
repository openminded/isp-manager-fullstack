/**
 * PPPoE Management Page
 *
 * Main page for managing PPPoE users with real-time synchronization
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Wifi, WifiOff, Settings, UserCheck, UserX, Power, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { getPPPoEUsers, getPPPoEStatistics, disconnectPPPoEUser, updatePPPoEUserStatus, generatePPPoECredentials } from '@/lib/actions/pppoe';
import { PPPoEUserDialog } from '@/components/pppoe/pppoe-user-dialog';
import { PPPoEUserDetails } from '@/components/pppoe/pppoe-user-details';
import { formatBytes, formatDate, formatDuration } from '@/lib/utils';

// Types
interface PPPoEUser {
  id: string;
  username: string;
  customerName: string;
  profileName: string;
  connectionStatus: string;
  authStatus: string;
  isActive: boolean;
  isDisabled: boolean;
  localAddress: string;
  remoteAddress: string;
  lastConnectedAt: string | null;
  currentSessionStart: string | null;
  currentSessionDuration: number | null;
  totalBytesIn: number;
  totalBytesOut: number;
  currentSessionBytesIn: number;
  currentSessionBytesOut: number;
  monthlyFee: string;
  deviceName: string;
  customerType: string;
  syncStatus: string;
  createdAt: string;
}

interface PPPoEStats {
  total: number;
  active: number;
  disabled: number;
  connected: number;
  residential: number;
  business: number;
}

export default function PPPoEPage() {
  const [users, setUsers] = useState<PPPoEUser[]>([]);
  const [stats, setStats] = useState<PPPoEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PPPoEUser | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<PPPoEUser | null>(null);

  // Load PPPoE users and statistics
  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const result = await getPPPoEUsers({
        page,
        limit: 20,
        search,
        customerId: filterCustomer,
        deviceId: filterDevice,
        profileId: filterProfile,
        status: filterStatus,
      });

      if (result.success && result.data) {
        setUsers(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        toast.error(result.error || 'Failed to load PPPoE users');
      }
    } catch (error) {
      toast.error('Failed to load PPPoE users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getPPPoEStatistics();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  // Handle search and filters
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadUsers(1);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, filterCustomer, filterDevice, filterProfile, filterStatus]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    await loadStats();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Handle user actions
  const handleEditUser = (user: PPPoEUser) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  const handleViewUser = (user: PPPoEUser) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const handleToggleUser = async (user: PPPoEUser, enabled: boolean) => {
    try {
      const result = await updatePPPoEUserStatus({
        id: user.id,
        isActive: enabled,
        isDisabled: !enabled,
      });

      if (result.success) {
        toast.success(`User ${enabled ? 'enabled' : 'disabled'} successfully`);
        loadUsers(currentPage);
        loadStats();
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  const handleDisconnectUser = async (user: PPPoEUser) => {
    if (window.confirm(`Are you sure you want to disconnect ${user.username}?`)) {
      try {
        const result = await disconnectPPPoEUser(user.id);

        if (result.success) {
          toast.success('User disconnected successfully');
          loadUsers(currentPage);
          loadStats();
        } else {
          toast.error(result.error || 'Failed to disconnect user');
        }
      } catch (error) {
        toast.error('Failed to disconnect user');
        console.error(error);
      }
    }
  };

  const handleUserSaved = () => {
    setShowDialog(false);
    setEditingUser(null);
    loadUsers(currentPage);
    loadStats();
    toast.success(editingUser ? 'PPPoE user updated successfully' : 'PPPoE user created successfully');
  };

  const handleGenerateCredentials = async () => {
    try {
      const result = await generatePPPoECredentials();
      if (result.success && result.data) {
        navigator.clipboard.writeText(`Username: ${result.data.username}\nPassword: ${result.data.password}`);
        toast.success('Credentials generated and copied to clipboard');
      } else {
        toast.error('Failed to generate credentials');
      }
    } catch (error) {
      toast.error('Failed to generate credentials');
    }
  };

  // Helper functions
  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'residential':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PPPoE Management</h1>
          <p className="text-muted-foreground">
            Manage PPPoE users and their connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateCredentials}>
            <Settings className="mr-2 h-4 w-4" />
            Generate Credentials
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add PPPoE User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disabled</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Residential</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.residential}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.business}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PPPoE users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="disconnected">Disconnected</SelectItem>
              <SelectItem value="connecting">Connecting</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PPPoE Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>PPPoE Users</CardTitle>
          <CardDescription>
            Manage PPPoE user accounts and monitor their connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Wifi className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No PPPoE users found</p>
                          <Button variant="outline" onClick={() => setShowDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add your first PPPoE user
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <div className="font-medium">{user.username}</div>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className={getSyncColor(user.syncStatus)}>
                                  {user.syncStatus}
                                </Badge>
                                {!user.isActive && (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.customerName}</div>
                            <Badge variant="secondary" className={getCustomerTypeColor(user.customerType)}>
                              {user.customerType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{user.profileName}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.monthlyFee || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getConnectionColor(user.connectionStatus)}>
                            <span className="flex items-center gap-1">
                              {getConnectionIcon(user.connectionStatus)}
                              {user.connectionStatus}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Local: {user.localAddress || 'N/A'}</div>
                            <div className="text-muted-foreground">
                              Remote: {user.remoteAddress || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              Total: {formatBytes(user.totalBytesIn + user.totalBytesOut)}
                            </div>
                            {user.currentSessionBytesIn > 0 && (
                              <div className="text-muted-foreground">
                                Session: {formatBytes(user.currentSessionBytesIn + user.currentSessionBytesOut)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.currentSessionStart ? (
                              <div>
                                <div>{formatDuration(user.currentSessionDuration || 0)}</div>
                                <div className="text-muted-foreground">
                                  since {formatDate(new Date(user.currentSessionStart))}
                                </div>
                              </div>
                            ) : user.lastConnectedAt ? (
                              <div className="text-muted-foreground">
                                Last: {formatDate(new Date(user.lastConnectedAt))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">Never connected</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{user.deviceName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Switch
                                checked={!user.isDisabled}
                                onCheckedChange={(checked) => handleToggleUser(user, checked)}
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                {user.isDisabled ? 'Disabled' : 'Enabled'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                Edit user
                              </DropdownMenuItem>
                              {user.connectionStatus === 'connected' && (
                                <DropdownMenuItem onClick={() => handleDisconnectUser(user)}>
                                  <Power className="mr-2 h-4 w-4" />
                                  Disconnect
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleUser(user, !user.isActive)}
                                className={user.isActive ? 'text-red-600' : 'text-green-600'}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* PPPoE User Dialog */}
      <PPPoEUserDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        user={editingUser}
        onSave={handleUserSaved}
      />

      {/* PPPoE User Details */}
      <PPPoEUserDetails
        open={showDetails}
        onOpenChange={setShowDetails}
        userId={selectedUser?.id}
        onEdit={() => {
          setShowDetails(false);
          setEditingUser(selectedUser);
          setShowDialog(true);
        }}
      />
    </div>
  );
}