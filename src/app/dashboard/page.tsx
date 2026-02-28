"use client";

import { useStoreData } from '@/hooks/use-store-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Package, 
  AlertTriangle,
  ShoppingCart,
  Zap
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

export default function DashboardPage() {
  const { store } = useStoreData();

  if (!store) return null;

  const totalOnlineRevenue = store.orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalInPersonRevenue = store.inPersonSales.reduce((sum, s) => sum + s.actualAmountCollected, 0);
  const totalRevenue = totalOnlineRevenue + totalInPersonRevenue;
  
  const totalProfit = store.inPersonSales.reduce((sum, s) => sum + s.profit, 0);
  const totalLoss = store.inPersonSales.reduce((sum, s) => sum + s.loss, 0);
  const totalOvercharge = store.inPersonSales.reduce((sum, s) => sum + s.extraCharge, 0);
  
  const totalOrders = store.orders.length + store.inPersonSales.length;

  const pieData = [
    { name: 'Online', value: totalOnlineRevenue },
    { name: 'In-Person', value: totalInPersonRevenue },
  ];

  const COLORS = ['#6B22CC', '#8989CE'];

  // Mock monthly revenue data based on current total
  const barData = [
    { name: 'Jan', revenue: totalRevenue * 0.1 },
    { name: 'Feb', revenue: totalRevenue * 0.15 },
    { name: 'Mar', revenue: totalRevenue * 0.2 },
    { name: 'Apr', revenue: totalRevenue * 0.25 },
    { name: 'May', revenue: totalRevenue * 0.3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Welcome back, {store.storeName}</h1>
        <p className="text-muted-foreground">Here's what's happening in your business today.</p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-primary/10">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Simulated monthly growth based on your data</CardDescription>
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
                <Bar dataKey="revenue" fill="#6B22CC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-primary/10">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Online vs In-Person Sales</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic">No data to display</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}