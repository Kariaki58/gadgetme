"use client";

import { useState, useEffect, useCallback } from 'react';
import { StoreData, Product, Order, AuthState, CartItem, POSTransaction } from '@/types/store';
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
    
    // Default account details (store owner can update later)
    const defaultAccountDetails = {
      bankName: 'Your Bank Name',
      accountNumber: '0000000000',
      accountName: storeName,
    };
    
    // Add dummy products for demonstration
    const dummyProducts: Product[] = [
      {
        id: generateId(),
        name: 'iPhone 15 Pro Max',
        description: 'Latest flagship smartphone with A17 Pro chip, 6.7-inch Super Retina XDR display, and advanced camera system. Perfect for photography enthusiasts and power users.',
        category: 'Smartphones',
        costPrice: 850000,
        sellingPrice: 1200000,
        stock: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android device with S Pen, 200MP camera, and Snapdragon 8 Gen 3. Ideal for productivity and creative work.',
        category: 'Smartphones',
        costPrice: 780000,
        sellingPrice: 1100000,
        stock: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'MacBook Pro 16" M3',
        description: 'Powerful laptop with M3 chip, 16GB RAM, and stunning Liquid Retina XDR display. Perfect for professionals and content creators.',
        category: 'Laptops',
        costPrice: 1800000,
        sellingPrice: 2500000,
        stock: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Dell XPS 15',
        description: 'Premium Windows laptop with Intel Core i7, 16GB RAM, and 4K OLED display. Great for business and creative professionals.',
        category: 'Laptops',
        costPrice: 1200000,
        sellingPrice: 1650000,
        stock: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'AirPods Pro (2nd Gen)',
        description: 'Active Noise Cancellation, Spatial Audio, and Adaptive EQ. Premium wireless earbuds with exceptional sound quality.',
        category: 'Audio',
        costPrice: 85000,
        sellingPrice: 120000,
        stock: 25,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise cancellation headphones with 30-hour battery life and premium sound quality. Perfect for travel and work.',
        category: 'Audio',
        costPrice: 95000,
        sellingPrice: 135000,
        stock: 18,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'iPad Pro 12.9" M2',
        description: 'Powerful tablet with M2 chip, 12.9-inch Liquid Retina XDR display, and Apple Pencil support. Ideal for artists and professionals.',
        category: 'Tablets',
        costPrice: 650000,
        sellingPrice: 890000,
        stock: 14,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Samsung Galaxy Tab S9 Ultra',
        description: 'Premium Android tablet with S Pen, 14.6-inch AMOLED display, and Snapdragon 8 Gen 2. Great for multitasking and creativity.',
        category: 'Tablets',
        costPrice: 580000,
        sellingPrice: 780000,
        stock: 11,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Apple Watch Ultra 2',
        description: 'Rugged smartwatch with titanium case, advanced fitness tracking, and 36-hour battery life. Perfect for athletes and adventurers.',
        category: 'Wearables',
        costPrice: 320000,
        sellingPrice: 450000,
        stock: 20,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Samsung Galaxy Watch 6 Classic',
        description: 'Premium smartwatch with rotating bezel, advanced health monitoring, and 40-hour battery life. Stylish and functional.',
        category: 'Wearables',
        costPrice: 180000,
        sellingPrice: 250000,
        stock: 22,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Nintendo Switch OLED',
        description: 'Gaming console with 7-inch OLED screen, enhanced audio, and 64GB internal storage. Perfect for gaming on the go.',
        category: 'Gaming',
        costPrice: 180000,
        sellingPrice: 250000,
        stock: 16,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'PlayStation 5',
        description: 'Next-gen gaming console with ray tracing, 4K gaming, and lightning-fast SSD. Includes DualSense wireless controller.',
        category: 'Gaming',
        costPrice: 320000,
        sellingPrice: 450000,
        stock: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Xbox Series X',
        description: 'Powerful gaming console with 4K gaming, 120 FPS support, and Game Pass compatibility. Includes wireless controller.',
        category: 'Gaming',
        costPrice: 300000,
        sellingPrice: 420000,
        stock: 7,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'Canon EOS R6 Mark II',
        description: 'Professional mirrorless camera with 24MP sensor, 4K video recording, and advanced autofocus. Perfect for photographers.',
        category: 'Cameras',
        costPrice: 1500000,
        sellingPrice: 2100000,
        stock: 6,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'DJI Mini 4 Pro',
        description: 'Compact drone with 4K video, obstacle avoidance, and 34-minute flight time. Perfect for aerial photography and videography.',
        category: 'Cameras',
        costPrice: 450000,
        sellingPrice: 650000,
        stock: 9,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        name: 'OnePlus 12',
        description: 'Flagship smartphone with Snapdragon 8 Gen 3, 100W fast charging, and 50MP triple camera system. Great value for money.',
        category: 'Smartphones',
        costPrice: 450000,
        sellingPrice: 650000,
        stock: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    
    const newStore: StoreData = {
      storeId,
      storeName,
      ownerEmail: email,
      accountDetails: defaultAccountDetails,
      products: dummyProducts,
      orders: [],
      posTransactions: [],
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

  const addPOSTransaction = (
    customerName: string,
    items: CartItem[],
    expectedAmount: number,
    actualAmountCollected: number,
    extraCharge: number,
    profit: number,
    loss: number
  ) => {
    if (!store) return false;

    // Check stock and update
    let updatedProducts = store.products;
    for (const item of items) {
      const product = updatedProducts.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return false;
      }
      updatedProducts = updatedProducts.map(p =>
        p.id === item.productId ? { ...p, stock: p.stock - item.quantity } : p
      );
    }

    const newTransaction: POSTransaction = {
      id: generateId(),
      customerName,
      items,
      expectedAmount,
      actualAmountCollected,
      extraCharge,
      profit,
      loss,
      createdAt: new Date().toISOString(),
    };

    const updatedStore = {
      ...store,
      posTransactions: [newTransaction, ...(store.posTransactions || [])],
      products: updatedProducts,
    };

    saveStore(updatedStore);
    return true;
  };

  const placeCartOrder = (items: CartItem[], customerName: string, customerPhone: string) => {
    if (!store) return false;

    // Check stock availability
    for (const item of items) {
      const product = store.products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return false;
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder: Order = {
      id: generateId(),
      items,
      customerName,
      customerPhone,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      type: 'cart',
      createdAt: new Date().toISOString(),
    };

    const updatedStore = {
      ...store,
      orders: [newOrder, ...store.orders],
    };

    saveStore(updatedStore);
    return true;
  };

  const confirmPayment = (orderId: string) => {
    if (!store) return false;

    const order = store.orders.find(o => o.id === orderId);
    if (!order || order.paymentStatus === 'paid') return false;

    // Update stock for cart items
    let updatedProducts = store.products;
    if (order.items) {
      for (const item of order.items) {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId ? { ...p, stock: p.stock - item.quantity } : p
        );
      }
    } else if (order.productId) {
      // Handle legacy single-item orders
      updatedProducts = updatedProducts.map(p =>
        p.id === order.productId ? { ...p, stock: p.stock - (order.quantity || 1) } : p
      );
    }

    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'paid',
      orderStatus: 'paid',
      paymentConfirmedAt: new Date().toISOString(),
    };

    const updatedStore = {
      ...store,
      orders: store.orders.map(o => o.id === orderId ? updatedOrder : o),
      products: updatedProducts,
    };

    saveStore(updatedStore);
    return true;
  };

  const updateOrderStatus = (orderId: string, orderStatus: Order['orderStatus']) => {
    if (!store) return false;

    const updatedStore = {
      ...store,
      orders: store.orders.map(o =>
        o.id === orderId ? { ...o, orderStatus } : o
      ),
    };

    saveStore(updatedStore);
    return true;
  };

  const updateAccountDetails = (accountDetails: StoreData['accountDetails']) => {
    if (!store) return;

    const updatedStore = {
      ...store,
      accountDetails,
    };

    saveStore(updatedStore);
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
    addPOSTransaction,
    placeCartOrder,
    confirmPayment,
    updateOrderStatus,
    updateAccountDetails,
  };
}