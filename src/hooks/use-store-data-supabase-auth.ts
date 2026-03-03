"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { transformProduct } from '@/lib/supabase/transformers';
import { Product, StoreData, Order, POSTransaction } from '@/types/store';

interface Store {
  id: string; // UUID for internal use
  storeId: string; // Short ID for public URLs
  storeName: string;
  ownerEmail: string;
  logoUrl?: string;
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    phoneNumber?: string;
  };
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
}

export function useStoreDataSupabaseAuth() {
  const supabase = createClient();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load store data
  const loadStoreData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (storeError || !storeData) {
        console.error('Error loading store or store not found:', storeError);
        setLoading(false);
        return;
      }

      setStore({
        id: storeData.id,
        storeId: storeData.store_id,
        storeName: storeData.store_name,
        ownerEmail: storeData.owner_email,
        logoUrl: storeData.logo_url,
        accountDetails: storeData.account_bank_name ? {
          bankName: storeData.account_bank_name,
          accountNumber: storeData.account_number,
          accountName: storeData.account_name,
          phoneNumber: storeData.account_phone,
        } : undefined,
        acceptsDelivery: storeData.accepts_delivery || false,
        acceptsPickup: storeData.accepts_pickup !== undefined ? storeData.accepts_pickup : true,
        whatsappNumber: storeData.whatsapp_number,
        address: storeData.address,
        city: storeData.city,
        state: storeData.state,
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

      if (productsError) {
        console.error('Error loading products:', productsError);
      } else {
        const transformedProducts = productsData.map(transformProduct);
        setProducts(transformedProducts);
      }

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
      } else {
        // Transform orders
        const transformedOrders = ordersData.map(order => ({
          id: order.id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          totalAmount: parseFloat(order.total_amount),
          status: order.status,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          type: order.type,
          createdAt: order.created_at,
          paymentConfirmedAt: order.payment_confirmed_at,
          notes: order.notes,
          deliveryAddress: order.delivery_address,
          deliveryCity: order.delivery_city,
          deliveryState: order.delivery_state,
          deliveryCountry: order.delivery_country,
          items: order.order_items?.map((item: any) => ({
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })) || [],
        }));
        setOrders(transformedOrders);
      }

      // Load POS transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('pos_transactions')
        .select(`
          *,
          pos_transaction_items (*)
        `)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
      } else {
        const transformedTransactions = transactionsData.map(transaction => ({
          id: transaction.id,
          customerName: transaction.customer_name,
          expectedAmount: parseFloat(transaction.expected_amount),
          actualAmountCollected: parseFloat(transaction.actual_amount_collected),
          extraCharge: parseFloat(transaction.extra_charge),
          profit: parseFloat(transaction.profit),
          loss: parseFloat(transaction.loss),
          paymentMethod: transaction.payment_method || 'cash',
          createdAt: transaction.created_at,
          items: transaction.pos_transaction_items?.map((item: any) => ({
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })) || [],
        }));
        setPosTransactions(transformedTransactions);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const updateAccountDetails = useCallback(async (accountDetails: Store['accountDetails']) => {
    if (!store || !user) return;

    const { error } = await supabase
      .from('stores')
      .update({
        account_bank_name: accountDetails?.bankName,
        account_number: accountDetails?.accountNumber,
        account_name: accountDetails?.accountName,
        account_phone: accountDetails?.phoneNumber,
      })
      .eq('id', store.id);

    if (error) {
      console.error('Error updating account details:', error);
      return;
    }

    setStore(prev => prev ? { ...prev, accountDetails } : null);
  }, [store, user, supabase]);

  return {
    store,
    products,
    orders,
    posTransactions,
    loading,
    loadStoreData,
    updateAccountDetails,
    refetchOrders: loadStoreData,
  };
}

