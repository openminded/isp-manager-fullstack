/**
 * Customer Details Component
 *
 * Component for viewing detailed customer information
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  User,
  Edit,
  Users,
  Router,
  FileText,
  History
} from 'lucide-react';
import { toast } from 'sonner';

import { getCustomer } from '@/lib/actions/customers';
import { getPPPoEUsers } from '@/lib/actions/pppoe';
import { formatDate, formatBytes } from '@/lib/utils';
import type { Customer } from '@/lib/actions/customers';

interface CustomerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  onEdit?: () => void;
}

interface PPPoEUser {
  id: string;
  username: string;
  profileName: string;
  connectionStatus: string;
  lastConnectedAt: string | null;
  totalBytesIn: number;
  totalBytesOut: number;
  monthlyFee: string;
  deviceName: string;
}

export function CustomerDetails({ open, onOpenChange, customerId, onEdit }: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pppoeUsers, setPppoeUsers] = useState<PPPoEUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Load customer data
  const loadCustomerData = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const [customerResult, pppoeResult] = await Promise.all([
        getCustomer(customerId),
        getPPPoEUsers({ customerId, limit: 10 }),
      ]);

      if (customerResult.success && customerResult.data) {
        setCustomer(customerResult.data);
      } else {
        toast.error(customerResult.error || 'Failed to load customer');
      }

      if (pppoeResult.success && pppoeResult.data) {
        setPppoeUsers(pppoeResult.data);
      }
    } catch (error) {
      toast.error('Failed to load customer data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      loadCustomerData();
    }
  }, [open, customerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!customerId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Customer Details</DialogTitle>
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={''} />
                <AvatarFallback className="text-lg">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{customer.displayName}</h2>
                <p className="text-muted-foreground">{customer.customerCode}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {customer.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.primaryEmail}</span>
                      </div>
                      {customer.primaryPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{customer.primaryPhone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Service Address</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{customer.serviceAddress}</p>
                        {customer.serviceAddress2 && <p>{customer.serviceAddress2}</p>}
                        <p>
                          {customer.serviceCity}, {customer.serviceState} {customer.servicePostalCode}
                        </p>
                        <p>{customer.serviceCountry}</p>
                      </div>
                    </div>

                    {customer.billingAddress && customer.billingAddress !== customer.serviceAddress && (
                      <div>
                        <h4 className="font-medium mb-2">Billing Address</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{customer.billingAddress}</p>
                          {customer.billingAddress2 && <p>{customer.billingAddress2}</p>}
                          <p>
                            {customer.billingCity}, {customer.billingState} {customer.billingPostalCode}
                          </p>
                          <p>{customer.billingCountry}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Service Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {customer.serviceStartDate && (
                        <div>
                          <span className="font-medium">Service Start:</span>
                          <p>{formatDate(new Date(customer.serviceStartDate))}</p>
                        </div>
                      )}
                      {customer.contractTermMonths && (
                        <div>
                          <span className="font-medium">Contract Term:</span>
                          <p>{customer.contractTermMonths} months</p>
                        </div>
                      )}
                      {customer.createdAt && (
                        <div>
                          <span className="font-medium">Customer Since:</span>
                          <p>{formatDate(new Date(customer.createdAt))}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {customer.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{customer.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Router className="h-5 w-5" />
                      PPPoE Services
                    </CardTitle>
                    <CardDescription>
                      Active and inactive PPPoE connections for this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pppoeUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Router className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No PPPoE services found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pppoeUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.username}</span>
                                <Badge variant="secondary" className={getConnectionColor(user.connectionStatus)}>
                                  {user.connectionStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Profile: {user.profileName} • Device: {user.deviceName}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Monthly: {user.monthlyFee || 'N/A'}</span>
                                {user.totalBytesIn > 0 && (
                                  <span>
                                    Usage: {formatBytes(user.totalBytesIn + user.totalBytesOut)}
                                  </span>
                                )}
                                {user.lastConnectedAt && (
                                  <span>Last seen: {formatDate(new Date(user.lastConnectedAt))}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Persons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.contacts && customer.contacts.length > 0 ? (
                      <div className="space-y-4">
                        {customer.contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">{contact.name}</div>
                              {contact.title && (
                                <p className="text-sm text-muted-foreground">{contact.title}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {contact.email && <span>{contact.email}</span>}
                                {contact.phone && <span>{contact.phone}</span>}
                              </div>
                              <div className="flex gap-2 mt-2">
                                {contact.isPrimary && <Badge variant="outline">Primary</Badge>}
                                {contact.isBilling && <Badge variant="outline">Billing</Badge>}
                                {contact.isTechnical && <Badge variant="outline">Technical</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No contact persons found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.documents && customer.documents.length > 0 ? (
                      <div className="space-y-4">
                        {customer.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <p className="text-sm text-muted-foreground">
                                Type: {doc.type} • {doc.fileSize ? `${doc.fileSize} bytes` : ''}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {doc.createdAt ? formatDate(new Date(doc.createdAt)) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No documents found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Customer not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}