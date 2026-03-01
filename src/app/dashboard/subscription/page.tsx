"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SubscriptionPage() {
  const { subscription, loading, isActive, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const router = useRouter();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  // Handle payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription is being activated. Please wait a moment...",
      });
      // Refresh subscription after a short delay to allow webhook to process
      setTimeout(() => {
        refreshSubscription();
      }, 3000);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/subscription');
    }
  }, [toast, refreshSubscription]);

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    try {
      setIsCreatingCheckout(true);
      setSelectedPlan(planType);
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();
      
      // Redirect to Flutterwave checkout
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout. Please try again.",
        variant: "destructive",
      });
      setIsCreatingCheckout(false);
      setSelectedPlan(null);
    }
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_end_date) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end_date);
    const diff = trialEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getDaysUntilRenewal = () => {
    if (!subscription?.current_period_end) return 0;
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const diff = periodEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const trialDaysRemaining = getTrialDaysRemaining();
  const daysUntilRenewal = getDaysUntilRenewal();
  const isTrialExpired = subscription?.status === 'trial' && trialDaysRemaining === 0;
  const isExpired = subscription?.status === 'expired' || isTrialExpired;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Subscription</span>
              <Badge 
                variant={isActive ? 'default' : 'destructive'}
                className="text-sm"
              >
                {subscription.status === 'trial' ? 'Trial' :
                 subscription.status === 'active' ? 'Active' :
                 subscription.status === 'expired' ? 'Expired' : 'Cancelled'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {subscription.plan_type === 'trial' && '14-day free trial period'}
              {subscription.plan_type === 'monthly' && 'Monthly subscription plan'}
              {subscription.plan_type === 'yearly' && 'Yearly subscription plan'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Plan Type</span>
                </div>
                <div className="text-lg font-semibold capitalize">
                  {subscription.plan_type}
                </div>
              </div>

              {subscription.plan_type === 'trial' && subscription.trial_end_date && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Trial Days Remaining</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ends: {new Date(subscription.trial_end_date).toLocaleDateString()}
                  </div>
                </div>
              )}

              {subscription.current_period_end && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Renewal Date</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </div>
                </div>
              )}

              {subscription.amount_paid && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Amount Paid</span>
                  </div>
                  <div className="text-lg font-semibold">
                    ₦{subscription.amount_paid.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {subscription.trial_start_date && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Trial Started:</span>{' '}
                  {new Date(subscription.trial_start_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {isExpired && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Subscription Required</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your {subscription.plan_type === 'trial' ? 'trial has expired' : 'subscription has expired'}. 
                  Please subscribe to continue using GadgetMe.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      {(!isActive || isExpired) && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Monthly Plan</span>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>Perfect for growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-primary">₦20,000</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <Separator />
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Full access to all features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Unlimited products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>POS system access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Analytics & reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Customer support</span>
                  </li>
                </ul>
                <Button
                  className="w-full h-12 text-base"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={isCreatingCheckout}
                >
                  {isCreatingCheckout && selectedPlan === 'monthly' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Subscribe Monthly
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-primary/20 hover:border-primary/40 transition-colors relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white">Best Value</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Yearly Plan</span>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>Best value - Save ₦40,000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-primary">₦200,000</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                  <div className="text-sm text-green-600 font-semibold mt-1">
                    Save ₦40,000 compared to monthly
                  </div>
                </div>
                <Separator />
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Full access to all features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Unlimited products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>POS system access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Analytics & reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
                <Button
                  className="w-full h-12 text-base bg-primary"
                  onClick={() => handleSubscribe('yearly')}
                  disabled={isCreatingCheckout}
                >
                  {isCreatingCheckout && selectedPlan === 'yearly' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Subscribe Yearly
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Active Subscription Info */}
      {isActive && !isExpired && subscription && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              <span>Your subscription is active</span>
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              You have full access to all GadgetMe features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date:</span>
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.plan_type !== 'trial' && subscription.amount_paid && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing amount:</span>
                  <span className="font-medium">
                    ₦{subscription.amount_paid.toLocaleString()} / {subscription.plan_type === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Secure payment processing powered by Flutterwave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• All payments are processed securely through Flutterwave</p>
            <p>• Your payment information is encrypted and secure</p>
            <p>• Subscriptions automatically renew unless cancelled</p>
            <p>• You can manage your subscription at any time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

