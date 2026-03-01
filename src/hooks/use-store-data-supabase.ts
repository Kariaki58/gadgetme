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
      
      // Load store by user_id (use maybeSingle to handle no store case)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      
      if (!storeData) {
        setStore(null);
        setProducts([]);
        setLoading(false);
        return;
      }

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

  const addProduct = useCallback(async (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>
  ): Promise<boolean> => {
    if (!store) return false;

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          category: product.category,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          baseStock: product.baseStock || 0,
          imageUrls: product.imageUrls || [],
          variants: product.variants || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[HOOK] Product creation failed:', {
          status: response.status,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to create product (${response.status})`);
      }

      await loadStoreData();
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  }, [store, loadStoreData]);

  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Product>
  ): Promise<boolean> => {
    if (!store) return false;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          category: updates.category,
          costPrice: updates.costPrice,
          sellingPrice: updates.sellingPrice,
          baseStock: updates.baseStock,
          imageUrls: updates.imageUrls || [],
          variants: updates.variants || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      await loadStoreData();
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }, [store, loadStoreData]);

  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!store) return false;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      await loadStoreData();
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }, [store, loadStoreData]);

  const createStore = useCallback(async (storeName: string, ownerEmail: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          ownerEmail,
          accountDetails: {
            bankName: 'Your Bank Name',
            accountNumber: '0000000000',
            accountName: storeName,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create store');
      }

      await loadStoreData();
      return true;
    } catch (error) {
      console.error('Error creating store:', error);
      return false;
    }
  }, [user, loadStoreData]);

  return {
    store,
    products,
    loading,
    loadStoreData,
    addPOSTransaction,
    addProduct,
    updateProduct,
    deleteProduct,
    createStore,
  };
}

