/**
 * Customer Dialog Component
 *
 * Dialog for creating and editing customers
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
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { createCustomer, updateCustomer, type CustomerCreateData, type CustomerUpdateData } from '@/lib/actions/customers';
import { getLocations } from '@/lib/actions/locations';
import { getEmployees } from '@/lib/actions/employees';
import { type Customer } from '@/lib/actions/customers';

// Form schema
const customerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  type: z.enum(['residential', 'business', 'wholesale', 'government', 'nonprofit', 'other']),
  primaryEmail: z.string().email('Valid email is required'),
  primaryPhone: z.string().optional(),
  mobilePhone: z.string().optional(),
  serviceAddress: z.string().min(1, 'Service address is required'),
  serviceAddress2: z.string().optional(),
  serviceCity: z.string().min(1, 'Service city is required'),
  serviceState: z.string().optional(),
  servicePostalCode: z.string().optional(),
  serviceCountry: z.string().default('US'),
  billingSameAsService: z.boolean().default(true),
  billingAddress: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().default('US'),
  locationId: z.string().uuid().optional(),
  serviceStartDate: z.string().optional(),
  contractTermMonths: z.number().min(1).default(1),
  accountManager: z.string().uuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSave: () => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onSave }: CustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; displayName: string }>>([]);
  const [newTag, setNewTag] = useState('');
  const [billingSameAsService, setBillingSameAsService] = useState(true);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      type: 'residential',
      primaryEmail: '',
      primaryPhone: '',
      mobilePhone: '',
      serviceAddress: '',
      serviceAddress2: '',
      serviceCity: '',
      serviceState: '',
      servicePostalCode: '',
      serviceCountry: 'US',
      billingSameAsService: true,
      billingAddress: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: 'US',
      locationId: '',
      serviceStartDate: '',
      contractTermMonths: 1,
      accountManager: '',
      notes: '',
      tags: [],
    },
  });

  // Load locations and employees
  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsResult, employeesResult] = await Promise.all([
          getLocations(),
          getEmployees(),
        ]);

        if (locationsResult.success && locationsResult.data) {
          setLocations(locationsResult.data);
        }

        if (employeesResult.success && employeesResult.data) {
          setEmployees(employeesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      form.reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        companyName: customer.companyName || '',
        type: customer.type || 'residential',
        primaryEmail: customer.primaryEmail || '',
        primaryPhone: customer.primaryPhone || '',
        mobilePhone: customer.mobilePhone || '',
        serviceAddress: customer.serviceAddress || '',
        serviceAddress2: customer.serviceAddress2 || '',
        serviceCity: customer.serviceCity || '',
        serviceState: customer.serviceState || '',
        servicePostalCode: customer.servicePostalCode || '',
        serviceCountry: customer.serviceCountry || 'US',
        billingSameAsService: !customer.billingAddress,
        billingAddress: customer.billingAddress || '',
        billingAddress2: customer.billingAddress2 || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingPostalCode: customer.billingPostalCode || '',
        billingCountry: customer.billingCountry || 'US',
        locationId: customer.locationId || '',
        serviceStartDate: customer.serviceStartDate
          ? new Date(customer.serviceStartDate).toISOString().split('T')[0]
          : '',
        contractTermMonths: customer.contractTermMonths || 1,
        accountManager: customer.accountManager || '',
        notes: customer.notes || '',
        tags: customer.tags || [],
      });
      setBillingSameAsService(!customer.billingAddress);
    } else {
      form.reset();
      setBillingSameAsService(true);
    }
  }, [customer, form]);

  // Handle form submission
  const onSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true);

      // Handle billing address same as service
      const submitData = {
        ...data,
        billingAddress: billingSameAsService ? data.serviceAddress : data.billingAddress,
        billingAddress2: billingSameAsService ? data.serviceAddress2 : data.billingAddress2,
        billingCity: billingSameAsService ? data.serviceCity : data.billingCity,
        billingState: billingSameAsService ? data.serviceState : data.billingState,
        billingPostalCode: billingSameAsService ? data.servicePostalCode : data.billingPostalCode,
        billingCountry: billingSameAsService ? data.serviceCountry : data.billingCountry,
      };

      let result;
      if (customer) {
        result = await updateCustomer({
          id: customer.id,
          ...submitData,
        } as CustomerUpdateData);
      } else {
        result = await createCustomer(submitData as CustomerCreateData);
      }

      if (result.success) {
        onSave();
      } else {
        toast.error(result.error || 'Failed to save customer');
      }
    } catch (error) {
      toast.error('Failed to save customer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle billing address toggle
  const handleBillingToggle = (checked: boolean) => {
    setBillingSameAsService(checked);
    form.setValue('billingSameAsService', checked);

    if (checked) {
      // Copy service address to billing address
      const serviceAddress = form.getValues('serviceAddress');
      const serviceAddress2 = form.getValues('serviceAddress2');
      const serviceCity = form.getValues('serviceCity');
      const serviceState = form.getValues('serviceState');
      const servicePostalCode = form.getValues('servicePostalCode');
      const serviceCountry = form.getValues('serviceCountry');

      form.setValue('billingAddress', serviceAddress);
      form.setValue('billingAddress2', serviceAddress2);
      form.setValue('billingCity', serviceCity);
      form.setValue('billingState', serviceState);
      form.setValue('billingPostalCode', servicePostalCode);
      form.setValue('billingCountry', serviceCountry);
    }
  };

  // Handle tags
  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription>
            {customer ? 'Update customer information.' : 'Create a new customer account.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-555-0123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service Address</h3>

              <FormField
                control={form.control}
                name="serviceAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceAddress2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="serviceCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servicePostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="billing-same-as-service"
                  checked={billingSameAsService}
                  onCheckedChange={handleBillingToggle}
                />
                <label htmlFor="billing-same-as-service" className="text-sm font-medium">
                  Billing address is the same as service address
                </label>
              </div>

              {!billingSameAsService && (
                <>
                  <h3 className="text-lg font-medium">Billing Address</h3>

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="billingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name} ({location.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractTermMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Term (Months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accountManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Manager</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tags</h3>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Tags</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this customer..."
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
                {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}