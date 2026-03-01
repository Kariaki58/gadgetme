"use client";

import { useState, useMemo } from 'react';
import { useStoreDataSupabaseAuth } from '@/hooks/use-store-data-supabase-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  BarChart3,
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
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
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getTotalStock } from '@/lib/supabase/transformers';

type TimeFilter = 'today' | '7days' | '30days' | 'all';

interface ProductAnalytics {
  productId: string;
  productName: string;
  category: string;
  totalRevenue: number;
  totalQuantitySold: number;
  currentStock: number;
  variants: VariantAnalytics[];
}

interface VariantAnalytics {
  variantId: string;
  colorName: string;
  colorHex: string;
  revenue: number;
  quantitySold: number;
  currentStock: number;
}

const COLORS = ['#6B22CC', '#8989CE', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

export default function AnalyticsPage() {
  const { store, products, orders, posTransactions, loading } = useStoreDataSupabaseAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');

  // Filter data based on time filter
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

  // Calculate product analytics
  const productAnalytics = useMemo(() => {
    if (!products || products.length === 0) return [];

    const { filteredOrders, filteredTransactions } = getFilteredData;
    const analyticsMap = new Map<string, ProductAnalytics>();

    // Initialize all products
    products.forEach(product => {
      const totalStock = getTotalStock(product);
      analyticsMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        category: product.category,
        totalRevenue: 0,
        totalQuantitySold: 0,
        currentStock: totalStock,
        variants: product.variants?.map(v => ({
          variantId: v.id,
          colorName: v.colorName,
          colorHex: v.colorHex,
          revenue: 0,
          quantitySold: 0,
          currentStock: v.stock,
        })) || [],
      });
    });

    // Process online orders
    filteredOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return;

          const analytics = analyticsMap.get(item.productId);
          if (analytics) {
            analytics.totalRevenue += item.price * item.quantity;
            analytics.totalQuantitySold += item.quantity;
          }
        });
      } else if (order.productId) {
        // Legacy single-item order
        const product = products.find(p => p.id === order.productId);
        if (!product) return;

        const analytics = analyticsMap.get(order.productId);
        if (analytics) {
          const quantity = order.quantity || 1;
          analytics.totalRevenue += product.sellingPrice * quantity;
          analytics.totalQuantitySold += quantity;
        }
      }
    });

    // Process POS transactions
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;

        const analytics = analyticsMap.get(item.productId);
        if (analytics) {
          analytics.totalRevenue += item.price * item.quantity;
          analytics.totalQuantitySold += item.quantity;

          // Handle variants if present
          if (item.variantId && analytics.variants.length > 0) {
            const variantAnalytics = analytics.variants.find(v => v.variantId === item.variantId);
            if (variantAnalytics) {
              variantAnalytics.revenue += item.price * item.quantity;
              variantAnalytics.quantitySold += item.quantity;
            }
          }
        }
      });
    });

    return Array.from(analyticsMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [products, getFilteredData]);

  // Top products for charts
  const topProducts = useMemo(() => {
    return productAnalytics
      .slice(0, 10)
      .map(p => ({
        name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
        revenue: p.totalRevenue,
        quantity: p.totalQuantitySold,
        stock: p.currentStock,
      }));
  }, [productAnalytics]);

  // Sales over time
  const salesOverTime = useMemo(() => {
    const { filteredOrders, filteredTransactions } = getFilteredData;
    const salesMap = new Map<string, { revenue: number; orders: number }>();

    [...filteredOrders, ...filteredTransactions].forEach(item => {
      const date = new Date(item.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      const existing = salesMap.get(dateKey) || { revenue: 0, orders: 0 };
      existing.revenue += 'totalAmount' in item ? item.totalAmount : item.actualAmountCollected;
      existing.orders += 1;
      salesMap.set(dateKey, existing);
    });

    return Array.from(salesMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [getFilteredData]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    productAnalytics.forEach(product => {
      const existing = categoryMap.get(product.category) || 0;
      categoryMap.set(product.category, existing + product.totalRevenue);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [productAnalytics]);

  // Stock alerts
  const lowStockProducts = useMemo(() => {
    return productAnalytics.filter(p => p.currentStock <= 10 && p.currentStock > 0);
  }, [productAnalytics]);

  const outOfStockProducts = useMemo(() => {
    return productAnalytics.filter(p => p.currentStock === 0);
  }, [productAnalytics]);

  // Summary stats
  const totalRevenue = useMemo(() => {
    return productAnalytics.reduce((sum, p) => sum + p.totalRevenue, 0);
  }, [productAnalytics]);

  const totalQuantitySold = useMemo(() => {
    return productAnalytics.reduce((sum, p) => sum + p.totalQuantitySold, 0);
  }, [productAnalytics]);

  const totalProducts = products?.length || 0;
  const totalStock = useMemo(() => {
    return productAnalytics.reduce((sum, p) => sum + p.currentStock, 0);
  }, [productAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Analytics</h1>
          <p className="text-muted-foreground">Track your products, variants, and sales performance</p>
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

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From all products</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantitySold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total units sold</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Units in stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Out of Stock ({outOfStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outOfStockProducts.slice(0, 5).map(product => (
                    <div key={product.productId} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{product.productName}</span>
                      <Badge variant="destructive">0 in stock</Badge>
                    </div>
                  ))}
                  {outOfStockProducts.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{outOfStockProducts.length - 5} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map(product => (
                    <div key={product.productId} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{product.productName}</span>
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        {product.currentStock} remaining
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 5} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>Best performing products in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" fill="#6B22CC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic text-center py-20">
                No sales data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>Revenue and order trends</CardDescription>
          </CardHeader>
          <CardContent>
            {salesOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6B22CC" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#8989CE" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic text-center py-20">
                No sales data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Revenue by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic text-center py-20">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Top Products by Quantity</CardTitle>
            <CardDescription>Most sold products</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#8989CE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm italic text-center py-20">
                No sales data for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Details Table */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Product Performance Details</CardTitle>
          <CardDescription>Revenue, sales, and stock for each product and variant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Stock Remaining</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  productAnalytics.map((product) => (
                    <>
                      <TableRow key={product.productId} className="bg-primary/5">
                        <TableCell className="font-bold">{product.productName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ₦{product.totalRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{product.totalQuantitySold}</TableCell>
                        <TableCell className="text-right">{product.currentStock}</TableCell>
                        <TableCell className="text-right">
                          {product.currentStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : product.currentStock <= 10 ? (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {product.variants.length > 0 && product.variants.map((variant) => (
                        <TableRow key={variant.variantId} className="bg-secondary/30">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: variant.colorHex }}
                              />
                              <span className="text-sm text-muted-foreground">
                                {variant.colorName} Variant
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-primary">
                            ₦{variant.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-sm">{variant.quantitySold}</TableCell>
                          <TableCell className="text-right text-sm">{variant.currentStock}</TableCell>
                          <TableCell className="text-right">
                            {variant.currentStock === 0 ? (
                              <Badge variant="destructive" className="text-xs">Out</Badge>
                            ) : variant.currentStock <= 5 ? (
                              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                Low
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                OK
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

