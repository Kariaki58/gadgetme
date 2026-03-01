"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

export interface Subscription {
  id: string;
  store_id: string;
  user_id: string;
  plan_type: 'trial' | 'monthly' | 'yearly';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_start_date: string | null;
  trial_end_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  flutterwave_subscription_id: string | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const supabase = createClient();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (storeError || !store) {
        setLoading(false);
        return;
      }

      // Get subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (subError || !subData) {
        setLoading(false);
        return;
      }

      const sub = subData as Subscription;
      setSubscription(sub);

      // Check if subscription is active
      const now = new Date();
      let active = false;

      if (sub.status === 'trial') {
        if (sub.trial_end_date) {
          const trialEnd = new Date(sub.trial_end_date);
          active = trialEnd > now;
        }
      } else if (sub.status === 'active') {
        if (sub.current_period_end) {
          const periodEnd = new Date(sub.current_period_end);
          active = periodEnd > now;
        } else {
          active = true; // Assume active if no end date
        }
      }

      setIsActive(active);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const refreshSubscription = useCallback(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  return {
    subscription,
    loading,
    isActive,
    refreshSubscription,
  };
}

