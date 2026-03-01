"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CircleDollarSign, 
  ExternalLink,
  LogOut,
  Receipt,
  ScanLine,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoreDataSupabaseAuth } from '@/hooks/use-store-data-supabase-auth';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { store } = useStoreDataSupabaseAuth();
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS System', href: '/dashboard/pos', icon: ScanLine },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Orders', href: '/dashboard/orders', icon: Receipt },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-card border-r h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 text-primary">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/store-logo.png"
              alt="Store Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold truncate">{store?.storeName || 'Store'}</span>
        </Link>
      </div>
      
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <Separator className="my-4 mx-3" />

        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wider">Public View</p>
          <Link
            href={`/store/${store?.storeId}/catalog`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            My Catalog
          </Link>
        </div>
      </div>

      <div className="p-4 bg-secondary/50 m-4 rounded-xl">
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-xs text-muted-foreground">Store ID</p>
          <p className="text-sm font-mono font-bold text-primary bg-white p-2 rounded border border-primary/20 break-all select-all">{store?.storeId}</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="w-full flex justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}