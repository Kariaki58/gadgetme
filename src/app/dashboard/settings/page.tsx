"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoreDataSupabaseAuth } from '@/hooks/use-store-data-supabase-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Check, CreditCard, Calendar, CheckCircle2, AlertTriangle, Upload, Image as ImageIcon, X } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStoreDataSupabaseAuth();
  const { subscription, isActive, refreshSubscription } = useSubscription();
  const [saving, setSaving] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: '',
    logoUrl: '',
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.storeName || '',
        logoUrl: (store as any).logoUrl || '',
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
      if ((store as any).logoUrl) {
        setLogoPreview((store as any).logoUrl);
      }
    }
  }, [store]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    setUploadingLogo(true);

    try {
      // Upload to server API endpoint
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, logoUrl: data.url }));
      setLogoPreview(data.url);
      
      toast({
        title: "Logo uploaded!",
        description: "Don't forget to save your settings to keep the logo.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  // Handle payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription is being activated. Please wait a moment...",
      });
      // Refresh subscription status
      setTimeout(() => {
        refreshSubscription();
      }, 2000);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [toast, refreshSubscription]);

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
          logoUrl: formData.logoUrl,
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
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Store Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
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
              <div className="space-y-2">
                <Label htmlFor="logo">Store Logo</Label>
                <div className="space-y-3">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Store logo" 
                        className="h-24 w-24 object-cover rounded-lg border-2 border-primary/20"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload your store logo</p>
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Image
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  {logoPreview && (
                    <div>
                      <Label htmlFor="logo-upload-change" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Change Logo
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="logo-upload-change"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading logo...
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your logo will appear on receipts and invoices
                </p>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="acceptsDelivery" className="text-sm sm:text-base">Accept Delivery Orders</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Allow customers to request delivery to their location
                  </p>
                </div>
                <Switch
                  id="acceptsDelivery"
                  checked={formData.acceptsDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsDelivery: checked })
                  }
                  className="sm:shrink-0"
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="acceptsPickup" className="text-sm sm:text-base">Accept Pickup Orders</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Allow customers to pick up orders from your location
                  </p>
                </div>
                <Switch
                  id="acceptsPickup"
                  checked={formData.acceptsPickup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsPickup: checked })
                  }
                  className="sm:shrink-0"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="space-y-2 sm:space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">Current Plan:</span>
                        <Badge variant={isActive ? 'default' : 'destructive'} className="text-xs">
                          {subscription.plan_type === 'trial' ? 'Trial' : 
                           subscription.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}
                        </Badge>
                        <Badge variant={isActive ? 'default' : 'destructive'} className="text-xs">
                          {subscription.status === 'trial' ? 'Trial' :
                           subscription.status === 'active' ? 'Active' :
                           subscription.status === 'expired' ? 'Expired' : 'Cancelled'}
                        </Badge>
                      </div>
                      {subscription.plan_type === 'trial' && subscription.trial_end_date && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="break-words">
                            Trial ends: {new Date(subscription.trial_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {subscription.current_period_end && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="break-words">
                            Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {subscription.amount_paid && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="break-words">
                            Amount: ₦{subscription.amount_paid.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isActive && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-3">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">Subscription Required</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mb-4">
                        Your subscription has expired. Please subscribe to continue using GadgetMe.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={async () => {
                            try {
                              setIsCreatingCheckout(true);
                              const response = await fetch('/api/subscriptions/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ planType: 'monthly' }),
                              });
                              const data = await response.json();
                              if (data.checkoutUrl) {
                                window.location.href = data.checkoutUrl;
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to create checkout. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsCreatingCheckout(false);
                            }
                          }}
                          disabled={isCreatingCheckout}
                          className="w-full sm:flex-1"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span className="text-xs sm:text-sm">Subscribe Monthly (₦20,000)</span>
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              setIsCreatingCheckout(true);
                              const response = await fetch('/api/subscriptions/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ planType: 'yearly' }),
                              });
                              const data = await response.json();
                              if (data.checkoutUrl) {
                                window.location.href = data.checkoutUrl;
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to create checkout. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsCreatingCheckout(false);
                            }
                          }}
                          disabled={isCreatingCheckout}
                          className="w-full sm:flex-1 bg-primary"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span className="text-xs sm:text-sm">Subscribe Yearly (₦200,000)</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No subscription found. Please contact support.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto min-w-[120px]"
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

