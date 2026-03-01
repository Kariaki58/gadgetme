"use client";

import { use } from 'react';
import { CartProvider } from '@/contexts/cart-context';

export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  
  return <CartProvider storeId={storeId}>{children}</CartProvider>;
}

