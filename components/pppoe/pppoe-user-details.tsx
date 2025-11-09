/**
 * PPPoE User Details Component
 *
 * Component for viewing detailed PPPoE user information
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wifi,
  WifiOff,
  User,
  Settings,
  Clock,
  Activity,
  Download,
  Upload,
  Calendar,
  Edit,
  History
} from 'lucide-react';
import { toast } from 'sonner';

import { getPPPoEUser } from '@/lib/actions/pppoe';
import { formatDate, formatBytes, formatDuration } from '@/lib/utils';

interface PPPoEUserDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onEdit?: () => void;
}

interface PPPoEUserDetails {
  id: string;
  username: string;
  serviceType: string;
  customerName: string;
  customerType: string;
  deviceName: string;
  profileName: string;
  profileUploadLimit: number;
  profileDownloadLimit: number;
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
  totalPacketsIn: number;
  totalPacketsOut: number;
  monthlyFee: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  recentSessions: Array<{
    id: string;
    connectedAt: string;
    disconnectedAt: string | null;
    duration: number | null;
    bytesIn: number;
    bytesOut: number;
    terminationCause: string;
  }>;
}

export function PPPoEUserDetails({ open, onOpenChange, userId, onEdit }: PPPoEUserDetailsProps) {
  const [user, setUser] = useState<PPPoEUserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user data
  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await getPPPoEUser(userId);

      if (result.success && result.data) {
        setUser(result.data as PPPoEUserDetails);
      } else {
        toast.error(result.error || 'Failed to load PPPoE user');
      }
    } catch (error) {
      toast.error('Failed to load PPPoE user data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      loadUserData();
    }
  }, [open, userId]);

  const getStatusColor = (status: string) => {
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

  if (!userId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">PPPoE User Details</DialogTitle>
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-muted-foreground">Service: {user.serviceType}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className={getStatusColor(user.connectionStatus)}>
                    <span className="flex items-center gap-1">
                      {getConnectionIcon(user.connectionStatus)}
                      {user.connectionStatus}
                    </span>
                  </Badge>
                  <Badge variant="secondary" className={getSyncColor(user.syncStatus)}>
                    {user.syncStatus}
                  </Badge>
                  {!user.isActive && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                  {user.isDisabled && (
                    <Badge variant="destructive">Disabled</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Customer:</span>
                        <p>{user.customerName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Device:</span>
                        <p>{user.deviceName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Profile:</span>
                        <p>{user.profileName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Monthly Fee:</span>
                        <p>{user.monthlyFee || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Status Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Connection Status:</span>
                        <p>{user.connectionStatus}</p>
                      </div>
                      <div>
                        <span className="font-medium">Authentication Status:</span>
                        <p>{user.authStatus}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Connected:</span>
                        <p>{user.lastConnectedAt ? formatDate(new Date(user.lastConnectedAt)) : 'Never'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Account Active:</span>
                        <p>{user.isActive ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments */}
                {user.comment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{user.comment}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="usage" className="space-y-6">
                {/* Usage Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Total Usage</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Download:</span>
                            <span>{formatBytes(user.totalBytesOut)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Upload:</span>
                            <span>{formatBytes(user.totalBytesIn)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>{formatBytes(user.totalBytesIn + user.totalBytesOut)}</span>
                          </div>
                        </div>
                      </div>

                      {user.currentSessionStart && (
                        <div>
                          <h4 className="font-medium mb-3">Current Session</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span>{formatDuration(user.currentSessionDuration || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Download:</span>
                              <span>{formatBytes(user.currentSessionBytesOut)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Upload:</span>
                              <span>{formatBytes(user.currentSessionBytesIn)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Total:</span>
                              <span>{formatBytes(user.currentSessionBytesIn + user.currentSessionBytesOut)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bandwidth Limits */}
                {(user.profileUploadLimit || user.profileDownloadLimit) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Bandwidth Limits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Download Limit:</span>
                          <p>{formatBytes(user.profileDownloadLimit || 0)}/s</p>
                        </div>
                        <div>
                          <span className="font-medium">Upload Limit:</span>
                          <p>{formatBytes(user.profileUploadLimit || 0)}/s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-6">
                {/* Network Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Network Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Local Address:</span>
                        <p>{user.localAddress || 'Not assigned'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Remote Address:</span>
                        <p>{user.remoteAddress || 'Dynamic'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Information */}
                {user.currentSessionStart && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Session Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Session Start:</span>
                          <p>{formatDate(new Date(user.currentSessionStart))}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p>{formatDuration(user.currentSessionDuration || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {/* Session History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Session History
                    </CardTitle>
                    <CardDescription>
                      Recent connection sessions for this user
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.recentSessions && user.recentSessions.length > 0 ? (
                      <div className="space-y-4">
                        {user.recentSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatDate(new Date(session.connectedAt))}
                                </span>
                                <Badge variant="outline">
                                  {session.terminationCause || 'Active'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Duration: {session.duration ? formatDuration(session.duration) : 'Active'}</span>
                                <span>
                                  Usage: {formatBytes(session.bytesIn + session.bytesOut)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No session history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Created:</span>
                        <p>{formatDate(new Date(user.createdAt))}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <p>{formatDate(new Date(user.updatedAt))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">PPPoE user not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}