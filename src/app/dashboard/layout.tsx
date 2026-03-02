"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { SubscriptionBlocker } from '@/components/subscription-blocker';
import { Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/use-subscription';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isActive, loading: subscriptionLoading } = useSubscription();
  
  // Don't block settings and subscription pages - users need to access them to subscribe
  const isSettingsPage = pathname === '/dashboard/settings';
  const isSubscriptionPage = pathname === '/dashboard/subscription';
  const isAllowedPage = isSettingsPage || isSubscriptionPage;

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-bounce">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show subscription blocker if subscription is not active (unless on settings or subscription page)
  if (!subscriptionLoading && !isActive && !isAllowedPage) {
    return (
      <div className="flex w-full overflow-x-hidden">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        <main className={`flex-1 min-h-screen bg-background overflow-x-hidden transition-all duration-300 ${
          isMobile ? 'ml-0 pt-14 px-4 py-4' : (sidebarOpen ? 'ml-64 p-4 sm:p-6 md:p-8' : 'p-4 sm:p-6 md:p-8')
        }`}>
          <SubscriptionBlocker />
        </main>
      </div>
    );
  }

  return (
    <div className="flex w-full overflow-x-hidden">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />
      <main className={`flex-1 min-h-screen bg-background overflow-x-hidden transition-all duration-300 ${
        isMobile ? 'ml-0 pt-14 px-4 pb-4' : (sidebarOpen ? 'ml-64 p-4 sm:p-6 md:p-8' : 'p-4 sm:p-6 md:p-8')
      }`}>
        <div className="max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}