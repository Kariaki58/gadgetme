"use client";

import { useState, useMemo } from 'react';
import { useStoreDataSupabaseAuth } from '@/hooks/use-store-data-supabase-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Package, 
  AlertTriangle,
  ShoppingCart,
  Zap,
  Wallet,
  ArrowLeftRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeCard } from '@/components/qr-code-card';

type TimeFilter = 'today' | '7days' | '30days' | 'all';

export default function DashboardPage() {
  const { store, orders, posTransactions, loading } = useStoreDataSupabaseAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  // Filter data based on time filter - MUST be called before any conditional returns
  const getFilteredData = useMemo(() => {
    if (!orders || !posTransactions) {
      return { filteredOrders: [], filteredTransactions: [] };
    }
    
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });

    const filteredTransactions = posTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= startDate;
    });

    return { filteredOrders, filteredTransactions };
  }, [orders, posTransactions, timeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!store) return null;

  const { filteredOrders, filteredTransactions } = getFilteredData;

  const totalOnlineRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPOSRevenue = filteredTransactions.reduce((sum, t) => sum + t.actualAmountCollected, 0);
  const totalRevenue = totalOnlineRevenue + totalPOSRevenue;
  
  const totalProfit = filteredTransactions.reduce((sum, t) => sum + t.profit, 0);
  const totalLoss = filteredTransactions.reduce((sum, t) => sum + t.loss, 0);
  const totalOvercharge = filteredTransactions.reduce((sum, t) => sum + t.extraCharge, 0);
  
  const totalOrders = filteredOrders.length + filteredTransactions.length;

  // Cash vs Transfer breakdown
  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'cash' || !t.paymentMethod);
  const transferTransactions = filteredTransactions.filter(t => t.paymentMethod === 'transfer');
  
  const cashRevenue = cashTransactions.reduce((sum, t) => sum + t.actualAmountCollected, 0);
  const transferRevenue = transferTransactions.reduce((sum, t) => sum + t.actualAmountCollected, 0);

  const pieData = [
    { name: 'Online', value: totalOnlineRevenue },
    { name: 'POS', value: totalPOSRevenue },
  ];

  const paymentMethodData = [
    { name: 'Cash', value: cashRevenue },
    { name: 'Transfer', value: transferRevenue },
  ];

  const COLORS = ['#6B22CC', '#8989CE'];
  const PAYMENT_COLORS = ['#6B22CC', '#3B82F6'];

  // Generate bar chart data based on filtered transactions
  const generateBarData = () => {
    const days = timeFilter === 'today' ? 1 : timeFilter === '7days' ? 7 : timeFilter === '30days' ? 30 : 12;
    const data: { name: string; revenue: number; cash: number; transfer: number }[] = [];
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeFilter === 'all') {
        // For all time, show months
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthRevenue = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= monthStart && tDate <= monthEnd;
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        const monthCash = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= monthStart && tDate <= monthEnd && (t.paymentMethod === 'cash' || !t.paymentMethod);
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        const monthTransfer = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= monthStart && tDate <= monthEnd && t.paymentMethod === 'transfer';
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        data.push({ name: monthName, revenue: monthRevenue, cash: monthCash, transfer: monthTransfer });
      } else {
        // For day/week/month, show days
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        const dayRevenue = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= dayStart && tDate <= dayEnd;
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        const dayCash = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= dayStart && tDate <= dayEnd && (t.paymentMethod === 'cash' || !t.paymentMethod);
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        const dayTransfer = filteredTransactions
          .filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= dayStart && tDate <= dayEnd && t.paymentMethod === 'transfer';
          })
          .reduce((sum, t) => sum + t.actualAmountCollected, 0);
        
        data.push({ name: dayName, revenue: dayRevenue, cash: dayCash, transfer: dayTransfer });
      }
    }
    
    return data;
  };

  const barData = generateBarData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Welcome back, {store.storeName}</h1>
          <p className="text-muted-foreground">Here's what's happening in your business.</p>
        </div>
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Net profit after costs</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Combined sales</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loss/Overcharge</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalLoss.toLocaleString()} / ₦{totalOvercharge.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Sales discrepancy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Payments</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{cashRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{cashTransactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transfer Payments</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{transferRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{transferTransactions.length} transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-primary/10">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>POS revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="cash" fill="#6B22CC" radius={[4, 4, 0, 0]} name="Cash" />
                <Bar dataKey="transfer" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Transfer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-primary/10">
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
            <CardDescription>Cash vs Transfer (POS Only)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {totalPOSRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic">No POS transactions to display</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Section */}
      {store?.storeId && (
        <div className="grid gap-6 md:grid-cols-2">
          <QRCodeCard storeId={store.storeId} storeName={store.storeName} />
        </div>
      )}
    </div>
  );
}