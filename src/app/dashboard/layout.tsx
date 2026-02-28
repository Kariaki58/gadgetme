"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreData } from '@/hooks/use-store-data';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { Smartphone } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authState } = useStoreData();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authState.isLoggedIn) {
      router.push('/login');
    }
  }, [authState.isLoggedIn, router, mounted]);

  if (!mounted || !authState.isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-bounce">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}