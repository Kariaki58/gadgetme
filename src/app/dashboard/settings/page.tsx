"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoreDataSupabaseAuth } from '@/hooks/use-store-data-supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStoreDataSupabaseAuth();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: '',
    accountDetails: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      phoneNumber: '',
    },
    acceptsDelivery: false,
    acceptsPickup: true,
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.storeName || '',
        accountDetails: {
          bankName: store.accountDetails?.bankName || '',
          accountNumber: store.accountDetails?.accountNumber || '',
          accountName: store.accountDetails?.accountName || '',
          phoneNumber: store.accountDetails?.phoneNumber || '',
        },
        acceptsDelivery: (store as any).acceptsDelivery || false,
        acceptsPickup: (store as any).acceptsPickup !== undefined ? (store as any).acceptsPickup : true,
        whatsappNumber: (store as any).whatsappNumber || '',
        address: (store as any).address || '',
        city: (store as any).city || '',
        state: (store as any).state || '',
      });
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setSaving(true);
    try {
      const response = await fetch('/api/stores', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: store.id,
          storeName: formData.storeName,
          accountDetails: formData.accountDetails,
          acceptsDelivery: formData.acceptsDelivery,
          acceptsPickup: formData.acceptsPickup,
          whatsappNumber: formData.whatsappNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast({
        title: "Settings saved!",
        description: "Your store settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Store not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your store details, account information, and delivery options.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Account Details</CardTitle>
              <CardDescription>Bank account information for receiving payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.accountDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountDetails: { ...formData.accountDetails, bankName: e.target.value },
                    })
                  }
                  placeholder="e.g., Access Bank, GTBank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountDetails: { ...formData.accountDetails, accountNumber: e.target.value },
                    })
                  }
                  placeholder="10-digit account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountDetails.accountName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountDetails: { ...formData.accountDetails, accountName: e.target.value },
                    })
                  }
                  placeholder="Name on the account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Mobile Money)</Label>
                <Input
                  id="phoneNumber"
                  value={formData.accountDetails.phoneNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountDetails: { ...formData.accountDetails, phoneNumber: e.target.value },
                    })
                  }
                  placeholder="e.g., 08012345678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
              <CardDescription>Choose how customers can receive their orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="acceptsDelivery">Accept Delivery Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to request delivery to their location
                  </p>
                </div>
                <Switch
                  id="acceptsDelivery"
                  checked={formData.acceptsDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsDelivery: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="acceptsPickup">Accept Pickup Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pick up orders from your location
                  </p>
                </div>
                <Switch
                  id="acceptsPickup"
                  checked={formData.acceptsPickup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsPickup: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your contact details for customer communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="e.g., 2348012345678 (with country code)"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for customers to contact you after placing orders
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

