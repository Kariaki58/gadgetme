"use client";

import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem, POSTransaction } from '@/types/store';
import { createClient } from '@/lib/supabase/client';
import { transformProduct, getStockForVariant } from '@/lib/supabase/transformers';
import { useAuth } from '@/contexts/auth-context';

interface Store {
  id: string; // UUID for internal use
  storeId: string; // Short ID for public URLs
  storeName: string;
  ownerEmail: string;
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    phoneNumber?: string;
  };
}

export function useStoreDataSupabase() {
  const supabase = createClient();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load store and products
  const loadStoreData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load store by user_id
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (storeError) throw storeError;

      setStore({
        id: storeData.id,
        storeId: storeData.store_id,
        storeName: storeData.store_name,
        ownerEmail: storeData.owner_email,
        accountDetails: storeData.account_bank_name ? {
          bankName: storeData.account_bank_name,
          accountNumber: storeData.account_number,
          accountName: storeData.account_name,
          phoneNumber: storeData.account_phone,
        } : undefined,
      });

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts = productsData.map(transformProduct);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const addPOSTransaction = useCallback(async (
    customerName: string,
    items: CartItem[],
    expectedAmount: number,
    actualAmountCollected: number,
    extraCharge: number,
    profit: number,
    loss: number
  ): Promise<boolean> => {
    if (!store) return false;

    try {
      const response = await fetch('/api/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          customerName,
          items,
          expectedAmount,
          actualAmountCollected,
          extraCharge,
          profit,
          loss,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      // Reload products to update stock
      await loadStoreData();
      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      return false;
    }
  }, [store, loadStoreData]);

  return {
    store,
    products,
    loading,
    loadStoreData,
    addPOSTransaction,
  };
}

