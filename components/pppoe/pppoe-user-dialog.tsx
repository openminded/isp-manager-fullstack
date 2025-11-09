/**
 * PPPoE User Dialog Component
 *
 * Dialog for creating and editing PPPoE users
 */

'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import { createPPPoEUser, updatePPPoEUser, generatePPPoECredentials, type PPPoEUserCreateData, type PPPoEUserUpdateData } from '@/lib/actions/pppoe';
import { getCustomers } from '@/lib/actions/customers';
import { getMikrotikDevices } from '@/lib/actions/devices';
import { getBandwidthProfiles } from '@/lib/actions/bandwidth-profiles';
import { formatCurrency } from '@/lib/utils';
import type { PPPoEUser } from '@/lib/actions/pppoe';

// Form schema
const pppoeUserFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  serviceType: z.enum(['pppoe', 'ppptp', 'l2tp', 'sstp', 'openvpn', 'wireguard', 'other']).default('pppoe'),
  customerId: z.string().uuid('Customer is required'),
  deviceId: z.string().uuid().optional(),
  profileId: z.string().uuid('Bandwidth profile is required'),
  profileName: z.string().optional(),
  callerId: z.string().optional(),
  localAddress: z.string().optional(),
  remoteAddress: z.string().optional(),
  poolName: z.string().optional(),
  monthlyFee: z.string().optional(),
  comment: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type PPPoEUserFormData = z.infer<typeof pppoeUserFormSchema>;

interface PPPoEUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: PPPoEUser | null;
  onSave: () => void;
}

export function PPPoEUserDialog({ open, onOpenChange, user, onSave }: PPPoEUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; displayName: string; type: string }>>([]);
  const [devices, setDevices] = useState<Array<{ id: string; name: string; hostname: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; displayName: string; monthlyPrice: string }>>([]);

  const form = useForm<PPPoEUserFormData>({
    resolver: zodResolver(pppoeUserFormSchema),
    defaultValues: {
      username: '',
      password: '',
      serviceType: 'pppoe',
      customerId: '',
      deviceId: '',
      profileId: '',
      profileName: '',
      callerId: '',
      localAddress: '',
      remoteAddress: '',
      poolName: '',
      monthlyFee: '',
      comment: '',
      tags: [],
    },
  });

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersResult, devicesResult, profilesResult] = await Promise.all([
          getCustomers(),
          getMikrotikDevices(),
          getBandwidthProfiles(),
        ]);

        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
        }

        if (devicesResult.success && devicesResult.data) {
          setDevices(devicesResult.data);
        }

        if (profilesResult.success && profilesResult.data) {
          setProfiles(profilesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || '',
        password: '', // Don't populate password for security
        serviceType: user.serviceType || 'pppoe',
        customerId: user.customerId || '',
        deviceId: user.deviceId || '',
        profileId: user.profileId || '',
        profileName: user.profileName || '',
        callerId: user.callerId || '',
        localAddress: user.localAddress || '',
        remoteAddress: user.remoteAddress || '',
        poolName: user.poolName || '',
        monthlyFee: user.monthlyFee || '',
        comment: user.comment || '',
        tags: user.tags || [],
      });
    } else {
      form.reset();
    }
  }, [user, form]);

  // Handle form submission
  const onSubmit = async (data: PPPoEUserFormData) => {
    try {
      setLoading(true);

      let result;
      if (user) {
        // Don't update password if it's empty
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }

        result = await updatePPPoEUser({
          id: user.id,
          ...updateData,
        } as PPPoEUserUpdateData);
      } else {
        result = await createPPPoEUser(data as PPPoEUserCreateData);
      }

      if (result.success) {
        onSave();
      } else {
        toast.error(result.error || 'Failed to save PPPoE user');
      }
    } catch (error) {
      toast.error('Failed to save PPPoE user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Generate credentials
  const handleGenerateCredentials = async () => {
    try {
      setGenerating(true);
      const result = await generatePPPoECredentials();

      if (result.success && result.data) {
        form.setValue('username', result.data.username);
        form.setValue('password', result.data.password);
        toast.success('Credentials generated successfully');
      } else {
        toast.error('Failed to generate credentials');
      }
    } catch (error) {
      toast.error('Failed to generate credentials');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  // Watch customer and profile changes
  const customerId = form.watch('customerId');
  const profileId = form.watch('profileId');

  // Update monthly fee when profile changes
  useEffect(() => {
    if (profileId) {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        form.setValue('profileName', profile.name);
        form.setValue('monthlyFee', profile.monthlyPrice);
      }
    }
  }, [profileId, profiles, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Edit PPPoE User' : 'Add New PPPoE User'}
          </DialogTitle>
          <DialogDescription>
            {user ? 'Update PPPoE user configuration.' : 'Create a new PPPoE user account.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  PPPoE Credentials
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCredentials}
                    disabled={generating}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    Generate
                  </Button>
                </CardTitle>
                <CardDescription>
                  Username and password for PPPoE authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="pppoe-user123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pppoe">PPPoE</SelectItem>
                          <SelectItem value="ppptp">PPTP</SelectItem>
                          <SelectItem value="l2tp">L2TP</SelectItem>
                          <SelectItem value="sstp">SSTP</SelectItem>
                          <SelectItem value="openvpn">OpenVPN</SelectItem>
                          <SelectItem value="wireguard">WireGuard</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Customer and Service */}
            <Card>
              <CardHeader>
                <CardTitle>Customer and Service</CardTitle>
                <CardDescription>
                  Assign the PPPoE user to a customer and select service parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center gap-2">
                                <span>{customer.displayName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {customer.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MikroTik Device (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No device selected</SelectItem>
                            {devices.map((device) => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.name} ({device.hostname})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Device where this PPPoE user will be created
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bandwidth Profile</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{profile.displayName}</span>
                                  {profile.monthlyPrice && (
                                    <span className="text-muted-foreground ml-2">
                                      {formatCurrency(profile.monthlyPrice)}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="monthlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Fee</FormLabel>
                      <FormControl>
                        <Input placeholder="49.99" {...field} />
                      </FormControl>
                      <FormDescription>
                        Override monthly fee for this user (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Network Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Network Configuration</CardTitle>
                <CardDescription>
                  Advanced network settings for the PPPoE user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="localAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Address</FormLabel>
                        <FormControl>
                          <Input placeholder="192.168.1.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Server-side IP address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remoteAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remote Address</FormLabel>
                        <FormControl>
                          <Input placeholder="10.0.0.100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Client IP address (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="callerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caller ID</FormLabel>
                        <FormControl>
                          <Input placeholder="00:11:22:33:44:55" {...field} />
                        </FormControl>
                        <FormDescription>
                          MAC address restriction (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="poolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Pool</FormLabel>
                        <FormControl>
                          <Input placeholder="pppoe-pool" {...field} />
                        </FormControl>
                        <FormDescription>
                          IP pool name for address assignment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this PPPoE user..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}