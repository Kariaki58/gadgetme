"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionBlocker() {
  const { subscription, loading, isActive, refreshSubscription } = useSubscription();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isActive) {
    return null; // Don't block if subscription is active
  }

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    try {
      setIsCreatingCheckout(true);
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

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialExpired = subscription?.status === 'trial' && trialDaysRemaining === 0;
  const isExpired = subscription?.status === 'expired' || isTrialExpired;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <CardTitle className="text-2xl text-amber-900 dark:text-amber-100">
                {isExpired ? 'Subscription Expired' : 'Trial Period Expired'}
              </CardTitle>
              <CardDescription className="text-amber-800 dark:text-amber-200 mt-1">
                {isExpired
                  ? 'Your subscription has expired. Please renew to continue using GadgetMe.'
                  : `Your ${subscription?.plan_type === 'trial' ? '14-day trial' : 'subscription'} has ended. Subscribe to continue.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription?.status === 'trial' && trialDaysRemaining > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">
                  {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="text-3xl font-bold text-primary">₦20,000</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Full access to all features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Unlimited products
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    POS system access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Analytics & reports
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={isCreatingCheckout}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isCreatingCheckout ? 'Processing...' : 'Subscribe Monthly'}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Yearly Plan</span>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </CardTitle>
                <CardDescription>Best value - Save ₦40,000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-primary">₦200,000</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                  <div className="text-xs text-green-600 font-semibold mt-1">
                    Save ₦40,000 compared to monthly
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Full access to all features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Unlimited products
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    POS system access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Analytics & reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary"
                  onClick={() => handleSubscribe('yearly')}
                  disabled={isCreatingCheckout}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isCreatingCheckout ? 'Processing...' : 'Subscribe Yearly'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Secure payment powered by Flutterwave
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

