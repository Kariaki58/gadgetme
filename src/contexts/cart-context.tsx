"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '@/types/store';
import { getStorageData, setStorageData } from '@/lib/storage-utils';

interface CartContextType {
  items: Array<CartItem & { product: Product }>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeId }: { children: ReactNode; storeId: string }) {
  const [items, setItems] = useState<Array<CartItem & { product: Product }>>([]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = getStorageData<Array<CartItem & { product: Product }>>(`cart_${storeId}`);
    if (savedCart) {
      setItems(savedCart);
    }
  }, [storeId]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    if (items.length > 0) {
      setStorageData(`cart_${storeId}`, items);
    } else {
      // Remove cart if empty
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`storestack_cart_${storeId}`);
      }
    }
  }, [items, storeId]);

  const addToCart = (product: Product, quantity: number) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          return prev; // Don't add if exceeds stock
        }
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          return prev; // Don't add if exceeds stock
        }
        return [...prev, {
          productId: product.id,
          quantity,
          price: product.sellingPrice,
          product
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => {
      const item = prev.find(i => i.productId === productId);
      if (item && quantity > item.product.stock) {
        return prev; // Don't update if exceeds stock
      }
      return prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

