"use client";

import { useState } from 'react';
import { useStoreData } from '@/hooks/use-store-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck,
  ShoppingCart,
  User,
  Phone,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/store';

export default function OrdersPage() {
  const { store, confirmPayment, updateOrderStatus } = useStoreData();
  const { toast } = useToast();

  if (!store) return null;

  // Filter cart orders and pending payment orders
  const cartOrders = store.orders.filter(o => o.type === 'cart');
  const pendingOrders = cartOrders.filter(o => o.paymentStatus === 'pending');
  const paidOrders = cartOrders.filter(o => o.paymentStatus === 'paid');

  const handleConfirmPayment = (orderId: string) => {
    const success = confirmPayment(orderId);
    if (success) {
      toast({
        title: "Payment Confirmed",
        description: "Order stock has been updated and payment is confirmed.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['orderStatus']) => {
    const success = updateOrderStatus(orderId, newStatus);
    if (success) {
      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getProductName = (order: Order) => {
    if (order.items && order.items.length > 0) {
      const product = store.products.find(p => p.id === order.items![0].productId);
      if (product) {
        return order.items.length === 1 
          ? product.name 
          : `${product.name} and ${order.items.length - 1} more`;
      }
    }
    if (order.productId) {
      const product = store.products.find(p => p.id === order.productId);
      return product?.name || 'Unknown Product';
    }
    return 'Unknown Product';
  };

  const getOrderItems = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => {
        const product = store.products.find(p => p.id === item.productId);
        return { product, quantity: item.quantity, price: item.price };
      }).filter(item => item.product);
    }
    return [];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Orders Management</h1>
        <p className="text-muted-foreground">Manage customer orders, confirm payments, and track order status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to package</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cart Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All cart-based orders</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Pending Payment Orders</CardTitle>
          <CardDescription>Confirm payment after customer has made transfer</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No pending payment orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => {
                const items = getOrderItems(order);
                return (
                  <Card key={order.id} className="border-primary/10">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" /> Pending Payment
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">₦{order.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{order.customerPhone}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Items:</p>
                            <div className="space-y-1">
                              {items.map((item, idx) => (
                                <div key={idx} className="text-sm text-muted-foreground">
                                  • {item.product!.name} × {item.quantity} (₦{item.price.toLocaleString()} each)
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => handleConfirmPayment(order.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Payment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Paid Orders</CardTitle>
          <CardDescription>Manage order fulfillment and shipping</CardDescription>
        </CardHeader>
        <CardContent>
          {paidOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No paid orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidOrders.map((order) => {
                    const items = getOrderItems(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {items.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-sm">
                                {item.product!.name} × {item.quantity}
                              </p>
                            ))}
                            {items.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{items.length - 2} more</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">₦{order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Select
                            value={order.orderStatus}
                            onValueChange={(value: Order['orderStatus']) => handleStatusUpdate(order.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="packaged">Packaged</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.orderStatus === 'paid' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                <Package className="h-3 w-3 mr-1" /> Ready to Package
                              </Badge>
                            )}
                            {order.orderStatus === 'packaged' && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                <Package className="h-3 w-3 mr-1" /> Packaged
                              </Badge>
                            )}
                            {order.orderStatus === 'shipped' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                <Truck className="h-3 w-3 mr-1" /> Shipped
                              </Badge>
                            )}
                            {order.orderStatus === 'delivered' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Delivered
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

