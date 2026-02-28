"use client";

import { useState, useEffect, useCallback } from 'react';
import { StoreData, Product, Order, InPersonSale, AuthState } from '@/types/store';
import { getStorageData, setStorageData, generateId } from '@/lib/storage-utils';

export function useStoreData() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    currentStoreId: null,
  });

  const [store, setStore] = useState<StoreData | null>(null);

  useEffect(() => {
    const savedAuth = getStorageData<AuthState>('auth');
    if (savedAuth?.isLoggedIn && savedAuth.currentStoreId) {
      const savedStore = getStorageData<StoreData>(`store_${savedAuth.currentStoreId}`);
      if (savedStore) {
        setAuthState(savedAuth);
        setStore(savedStore);
      }
    }
  }, []);

  const saveStore = useCallback((updatedStore: StoreData) => {
    setStore(updatedStore);
    setStorageData(`store_${updatedStore.storeId}`, updatedStore);
  }, []);

  const signup = (storeName: string, email: string) => {
    const storeId = generateId();
    const newStore: StoreData = {
      storeId,
      storeName,
      ownerEmail: email,
      products: [],
      orders: [],
      inPersonSales: [],
    };
    saveStore(newStore);
    const newAuth: AuthState = { isLoggedIn: true, currentStoreId: storeId };
    setAuthState(newAuth);
    setStorageData('auth', newAuth);
    return storeId;
  };

  const login = (storeId: string) => {
    const existingStore = getStorageData<StoreData>(`store_${storeId}`);
    if (existingStore) {
      const newAuth: AuthState = { isLoggedIn: true, currentStoreId: storeId };
      setAuthState(newAuth);
      setStorageData('auth', newAuth);
      setStore(existingStore);
      return true;
    }
    return false;
  };

  const logout = () => {
    const newAuth: AuthState = { isLoggedIn: false, currentStoreId: null };
    setAuthState(newAuth);
    setStorageData('auth', newAuth);
    setStore(null);
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    if (!store) return;
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedStore = {
      ...store,
      products: [newProduct, ...store.products],
    };
    saveStore(updatedStore);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    if (!store) return;
    const updatedStore = {
      ...store,
      products: store.products.map(p => p.id === productId ? { ...p, ...updates } : p),
    };
    saveStore(updatedStore);
  };

  const deleteProduct = (productId: string) => {
    if (!store) return;
    const updatedStore = {
      ...store,
      products: store.products.filter(p => p.id !== productId),
    };
    saveStore(updatedStore);
  };

  const placeOnlineOrder = (productId: string, customerName: string, customerPhone: string, quantity: number) => {
    const targetStore = store; 
    if (!targetStore) return;

    const product = targetStore.products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return false;

    const newOrder: Order = {
      id: generateId(),
      productId,
      customerName,
      customerPhone,
      quantity,
      totalAmount: product.sellingPrice * quantity,
      status: 'completed',
      type: 'online',
      createdAt: new Date().toISOString(),
    };

    const updatedStore = {
      ...targetStore,
      orders: [newOrder, ...targetStore.orders],
      products: targetStore.products.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p),
    };

    saveStore(updatedStore);
    return true;
  };

  const addInPersonSale = (productId: string, quantity: number, actualAmountCollected: number) => {
    if (!store) return;
    const product = store.products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return false;

    const expectedAmount = product.sellingPrice * quantity;
    const costBasis = product.costPrice * quantity;
    const extraCharge = Math.max(0, actualAmountCollected - expectedAmount);
    const profit = actualAmountCollected - costBasis;
    const loss = actualAmountCollected < costBasis ? costBasis - actualAmountCollected : 0;

    const newSale: InPersonSale = {
      id: generateId(),
      productId,
      customerName: 'In-Person Customer',
      customerPhone: 'N/A',
      quantity,
      totalAmount: actualAmountCollected,
      status: 'completed',
      type: 'in-person',
      createdAt: new Date().toISOString(),
      actualAmountCollected,
      expectedAmount,
      extraCharge,
      profit,
      loss,
    };

    const updatedStore = {
      ...store,
      inPersonSales: [newSale, ...store.inPersonSales],
      products: store.products.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p),
    };

    saveStore(updatedStore);
    return true;
  };

  return {
    authState,
    store,
    signup,
    login,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    placeOnlineOrder,
    addInPersonSale,
  };
}