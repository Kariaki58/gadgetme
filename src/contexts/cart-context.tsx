"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '@/types/store';
import { getStorageData, setStorageData } from '@/lib/storage-utils';

interface CartContextType {
  items: Array<CartItem & { product: Product }>;
  addToCart: (product: Product, quantity: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
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

  const addToCart = (product: Product, quantity: number, variantId?: string) => {
    setItems(prev => {
      // Find existing item with same productId and variantId
      const existingItem = prev.find(item => 
        item.productId === product.id && item.variantId === variantId
      );
      
      // Get available stock for variant or base
      const availableStock = variantId 
        ? (product.variants?.find(v => v.id === variantId)?.stock || 0)
        : product.baseStock;
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > availableStock) {
          return prev; // Don't add if exceeds stock
        }
        return prev.map(item =>
          item.productId === product.id && item.variantId === variantId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > availableStock) {
          return prev; // Don't add if exceeds stock
        }
        return [...prev, {
          productId: product.id,
          variantId,
          quantity,
          price: product.sellingPrice,
          product
        }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems(prev => {
      const item = prev.find(i => i.productId === productId && i.variantId === variantId);
      if (!item) return prev;
      
      // Get available stock for variant or base
      const availableStock = variantId 
        ? (item.product.variants?.find(v => v.id === variantId)?.stock || 0)
        : item.product.baseStock;
      
      if (quantity > availableStock) {
        return prev; // Don't update if exceeds stock
      }
      return prev.map(item =>
        item.productId === productId && item.variantId === variantId
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

