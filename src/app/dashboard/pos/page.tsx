"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, UserPlus, X, CreditCard, Smartphone, Wallet, ArrowLeftRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useStoreDataSupabase } from '@/hooks/use-store-data-supabase';
import { numberToWords } from '@/lib/number-to-words';
import { useAuth } from '@/contexts/auth-context';
import { getStockForVariant } from '@/lib/supabase/transformers';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

interface CustomerCart {
  id: string;
  customerName: string;
  items: CartItem[];
  createdAt: string;
}

export default function POSPage() {
  const { toast } = useToast();
  const initialCustomerId = String(Date.now());
  const [customers, setCustomers] = useState<CustomerCart[]>([
    {
      id: initialCustomerId,
      customerName: 'Customer 1',
      items: [],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activeCustomerId, setActiveCustomerId] = useState<string>(initialCustomerId);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actualAmountCollected, setActualAmountCollected] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<typeof products[0] | null>(null);
  const { user } = useAuth();
  const { store, products: storeProducts, loading, loadStoreData, addPOSTransaction } = useStoreDataSupabase();
  
  // Load store data on mount
  useEffect(() => {
    if (user) {
      loadStoreData();
    }
  }, [user, loadStoreData]);

  // Transform products for POS display
  const products = storeProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.sellingPrice,
    costPrice: p.costPrice,
    imageUrl: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null,
    stock: p.baseStock,
    variants: p.variants || [],
  }));

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || (customers.length > 0 ? customers[0] : null);
  
  // Ensure activeCustomerId is valid
  useEffect(() => {
    if (customers.length > 0 && !customers.find(c => c.id === activeCustomerId)) {
      setActiveCustomerId(customers[0].id);
    }
  }, [customers, activeCustomerId]);

  const addToCart = useCallback((productId: string, variantId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const storeProduct = storeProducts.find(p => p.id === productId);
    if (!storeProduct) return;

    // Get available stock
    const availableStock = variantId 
      ? getStockForVariant(storeProduct, variantId)
      : product.stock;

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === activeCustomerId
          ? {
              ...customer,
              items: (() => {
                const existingItem = customer.items.find(
                  item => item.productId === productId && item.variantId === variantId
                );
                if (existingItem) {
                  // Check stock
                  const currentQty = customer.items
                    .filter(item => item.productId === productId && item.variantId === variantId)
                    .reduce((sum, item) => sum + item.quantity, 0);
                  if (currentQty >= availableStock) {
                    toast({
                      title: "Stock Limit",
                      description: `Only ${availableStock} units available`,
                      variant: "destructive"
                    });
                    return customer.items;
                  }
                  return customer.items.map(item =>
                    item.productId === productId && item.variantId === variantId
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
                  );
                } else {
                  return [...customer.items, { 
                    productId, 
                    variantId,
                    quantity: 1, 
                    price: product.price 
                  }];
                }
              })(),
            }
          : customer
      )
    );
  }, [activeCustomerId, toast, products, storeProducts]);

  const handleProductClick = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // If product has variants, show variant selection dialog
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setShowVariantDialog(true);
    } else {
      // No variants, add directly to cart
      addToCart(productId);
    }
  }, [products, addToCart]);

  const updateQuantity = useCallback((productId: string, delta: number, variantId?: string) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === activeCustomerId
          ? {
              ...customer,
              items: customer.items
                .map(item =>
                  item.productId === productId && item.variantId === variantId
                    ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                    : item
                )
                .filter(item => item.quantity > 0),
            }
          : customer
      )
    );
  }, [activeCustomerId]);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === activeCustomerId
          ? {
              ...customer,
              items: customer.items.filter(item => 
                !(item.productId === productId && item.variantId === variantId)
              ),
            }
          : customer
      )
    );
  }, [activeCustomerId]);

  const addNewCustomer = useCallback(() => {
    // Find the highest customer number and add 1
    const existingNumbers = customers.map(c => {
      const match = c.customerName.match(/Customer (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers, 0) : 0;
    const newNumber = maxNumber + 1;
    const newId = String(Date.now() + Math.random()); // Use timestamp + random for unique ID
    const newCustomer: CustomerCart = {
      id: newId,
      customerName: `Customer ${newNumber}`,
      items: [],
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    setActiveCustomerId(newId);
    toast({
      title: "New Customer",
      description: `Started new cart for ${newCustomer.customerName}`,
    });
  }, [customers, toast]);

  const removeCustomer = useCallback((customerId: string) => {
    if (customers.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one customer cart must remain",
        variant: "destructive"
      });
      return;
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    if (activeCustomerId === customerId) {
      const remaining = customers.filter(c => c.id !== customerId);
      setActiveCustomerId(remaining[0]?.id || '1');
    }
  }, [customers, activeCustomerId, toast]);

  const getCartTotal = useCallback((items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, []);

  const getCartItemCount = useCallback((items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, []);

  const handlePayment = useCallback(() => {
    if (!activeCustomer || activeCustomer.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before proceeding to payment",
        variant: "destructive"
      });
      return;
    }
    const expectedAmount = getCartTotal(activeCustomer.items);
    setActualAmountCollected(expectedAmount.toString());
    setShowPaymentModal(true);
  }, [activeCustomer, getCartTotal, toast]);

  const handleConfirmPayment = useCallback(async () => {
    if (!activeCustomer || activeCustomer.items.length === 0) return;
    if (!store) {
      toast({
        title: "Error",
        description: "Store not loaded. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    const expectedAmount = getCartTotal(activeCustomer.items);
    const actualAmount = parseFloat(actualAmountCollected) || expectedAmount;
    
    // Calculate profit/loss
    const costBasis = activeCustomer.items.reduce((sum, item) => {
      const storeProduct = storeProducts.find(p => p.id === item.productId);
      if (!storeProduct) return sum;
      return sum + (storeProduct.costPrice * item.quantity);
    }, 0);
    
    const extraCharge = Math.max(0, actualAmount - expectedAmount);
    const profit = actualAmount - costBasis;
    const loss = actualAmount < costBasis ? costBasis - actualAmount : 0;

    // Save POS transaction
    const success = await addPOSTransaction(
      activeCustomer.customerName,
      activeCustomer.items,
      expectedAmount,
      actualAmount,
      extraCharge,
      profit,
      loss,
      paymentMethod
    );

    if (success) {
      toast({
        title: "Payment Confirmed!",
        description: `₦${actualAmount.toLocaleString()} collected from ${activeCustomer.customerName}`,
      });
      // Clear cart after payment
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === activeCustomerId
            ? { ...customer, items: [] }
            : customer
        )
      );
      setShowPaymentModal(false);
      setActualAmountCollected('');
      setPaymentMethod('cash');
      setIsProcessingPayment(false);
    } else {
      // More detailed error message
      const missingProducts = activeCustomer.items.filter(item => {
        const product = storeProducts.find(p => p.id === item.productId);
        if (!product) return true;
        const stock = item.variantId 
          ? getStockForVariant(product, item.variantId)
          : product.baseStock;
        return stock < item.quantity;
      });
      
      if (missingProducts.length > 0) {
        toast({
          title: "Stock Error",
          description: "Some items are out of stock or unavailable.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save transaction. Please try again.",
          variant: "destructive"
        });
      }
      setIsProcessingPayment(false);
    }
  }, [activeCustomer, activeCustomerId, actualAmountCollected, paymentMethod, getCartTotal, addPOSTransaction, toast, store, storeProducts]);

  const activeCartTotal = activeCustomer ? getCartTotal(activeCustomer.items) : 0;
  const activeCartItemCount = activeCustomer ? getCartItemCount(activeCustomer.items) : 0;

  return (
    <div className="fixed inset-0 left-64 top-0 right-0 bottom-0 flex flex-col bg-gradient-to-br from-background via-background to-secondary/20 overflow-hidden z-40">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fast checkout system</p>
        </div>
        <Button onClick={addNewCustomer} className="bg-primary hover:bg-primary/90 shadow-sm">
          <UserPlus className="mr-2 h-4 w-4" /> New Customer
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search and Category Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[1600px]">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or category filter</p>
              </div>
            ) : (
              filteredProducts.map(product => {
              const cartItem = activeCustomer?.items.find(item => item.productId === product.id);
              const inCartQty = cartItem?.quantity || 0;
              
              return (
                 <Card
                   key={product.id}
                   className="group hover:shadow-xl hover:border-primary/30 transition-all duration-200 border-primary/10 cursor-pointer bg-white overflow-hidden"
                   onClick={() => handleProductClick(product.id)}
                 >
                   <CardContent className="p-4 flex flex-col h-full">
                     <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl flex items-center justify-center mb-3 overflow-hidden group-hover:scale-105 transition-transform duration-200">
                       {product.imageUrl ? (
                         <img 
                           src={product.imageUrl} 
                           alt={product.name}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <Smartphone className="h-16 w-16 text-primary/20" />
                       )}
                     </div>
                     <div className="flex-1 flex flex-col">
                       <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem] text-foreground leading-tight">
                         {product.name}
                       </h3>
                       <div className="mb-3">
                         <p className="text-base font-black text-primary truncate">
                           ₦{product.price.toLocaleString()}
                         </p>
                         {product.stock > 0 && product.stock < 10 && (
                           <p className="text-xs text-amber-600 font-medium mt-1">
                             {product.stock} left
                           </p>
                         )}
                       </div>
                    {inCartQty > 0 && (
                      <Badge className="w-full justify-center bg-primary/90 text-primary-foreground mt-auto text-xs py-1.5 font-semibold">
                        {inCartQty} in cart
                      </Badge>
                    )}
                     </div>
                   </CardContent>
                 </Card>
              );
            }))}
          </div>
        </div>

        {/* Cart Panel - Always Visible */}
        <div className="w-96 border-l bg-white/95 backdrop-blur-sm shadow-2xl flex flex-col shrink-0">
          {/* Customer Tabs */}
          <div className="border-b bg-gradient-to-r from-secondary/40 to-secondary/20 p-3 flex gap-2 overflow-x-auto">
            {customers.map(customer => {
              const itemCount = getCartItemCount(customer.items);
              const isActive = customer.id === activeCustomerId;
              return (
                  <div
                    key={customer.id}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-white hover:bg-secondary/80 shadow-sm'
                    }`}
                    onClick={() => setActiveCustomerId(customer.id)}
                  >
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {customer.customerName}
                    </span>
                    {itemCount > 0 && (
                      <Badge
                        variant={isActive ? 'secondary' : 'default'}
                        className={`h-5 min-w-[24px] text-xs font-bold ${
                          isActive ? 'bg-white/20 text-white' : ''
                        }`}
                      >
                        {itemCount}
                      </Badge>
                    )}
                    {customers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomer(customer.id);
                        }}
                        className={`ml-1 hover:bg-black/10 rounded-full p-1 transition-colors ${
                          isActive ? 'hover:bg-white/20' : ''
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
              );
            })}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!activeCustomer || activeCustomer.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            ) : (
              activeCustomer.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                const storeProduct = storeProducts.find(p => p.id === item.productId);
                const variant = item.variantId && storeProduct 
                  ? storeProduct.variants?.find(v => v.id === item.variantId)
                  : null;

                return (
                  <Card key={`${item.productId}-${item.variantId || 'base'}-${index}`} className="border-primary/10 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Smartphone className="h-6 w-6 text-primary/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm line-clamp-2 mb-1 leading-tight">
                            {product.name}
                            {variant && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({variant.colorName})
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            ₦{item.price.toLocaleString()} each
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.productId, -1, item.variantId)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const product = products.find(p => p.id === item.productId);
                                const storeProduct = storeProducts.find(p => p.id === item.productId);
                                const maxStock = item.variantId && storeProduct
                                  ? getStockForVariant(storeProduct, item.variantId)
                                  : product?.stock || 0;
                                if (product && val <= maxStock) {
                                  setCustomers(prev =>
                                    prev.map(customer =>
                                      customer.id === activeCustomerId
                                        ? {
                                            ...customer,
                                            items: customer.items.map(i =>
                                              i.productId === item.productId && i.variantId === item.variantId
                                                ? { ...i, quantity: val }
                                                : i
                                            ).filter(i => i.quantity > 0),
                                          }
                                        : customer
                                    )
                                  );
                                }
                              }}
                              className="h-7 w-16 text-center text-sm font-bold"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.productId, 1, item.variantId)}
                              disabled={item.quantity >= (variant ? variant.stock : product.stock)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(item.productId, item.variantId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-primary/10 flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtotal</span>
                        <span className="font-bold text-base text-primary">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Cart Summary & Payment */}
          <div className="border-t bg-gradient-to-t from-secondary/40 to-white p-5 space-y-4 shrink-0 shadow-lg">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Items</span>
                <span className="font-bold text-foreground">{activeCartItemCount}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black border-t-2 border-primary/20 pt-3">
                <span className="text-foreground">Total</span>
                <span className="text-primary text-2xl">₦{activeCartTotal.toLocaleString()}</span>
              </div>
            </div>
            <Button
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
              onClick={handlePayment}
              disabled={!activeCustomer || activeCustomer.items.length === 0 || isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-2xl border-primary/20 shadow-2xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-1">Confirm Payment</h3>
                <p className="text-muted-foreground text-sm">Enter the actual amount collected</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-xl space-y-3 border border-primary/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Amount:</span>
                    <span className="font-bold">₦{getCartTotal(activeCustomer.items).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-xs text-muted-foreground italic">
                      {numberToWords(getCartTotal(activeCustomer.items))}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual-amount">Actual Amount Collected (₦)</Label>
                    <Input
                      id="actual-amount"
                      type="number"
                      value={actualAmountCollected}
                      onChange={(e) => setActualAmountCollected(e.target.value)}
                      placeholder="Enter amount"
                      className="text-lg font-bold"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        className={`h-12 ${paymentMethod === 'cash' ? 'bg-primary' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                        disabled={isProcessingPayment}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Cash
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                        className={`h-12 ${paymentMethod === 'transfer' ? 'bg-primary' : ''}`}
                        onClick={() => setPaymentMethod('transfer')}
                        disabled={isProcessingPayment}
                      >
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                  {actualAmountCollected && parseFloat(actualAmountCollected) > 0 && (
                    <div className="pt-2 border-t border-primary/10 space-y-2">
                      <p className="text-xs text-muted-foreground italic">
                        {numberToWords(parseFloat(actualAmountCollected))}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Difference:</span>
                        <span className={`font-bold ${
                          parseFloat(actualAmountCollected) >= getCartTotal(activeCustomer.items)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {parseFloat(actualAmountCollected) >= getCartTotal(activeCustomer.items) ? '+' : '-'} 
                          ₦{Math.abs((parseFloat(actualAmountCollected) || 0) - getCartTotal(activeCustomer.items)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setActualAmountCollected('');
                      setPaymentMethod('cash');
                    }}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-primary"
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Confirm Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Variant Selection Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Variant</DialogTitle>
            <DialogDescription>
              Choose a color variant for {selectedProductForVariant?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProductForVariant && (
            <div className="space-y-3 py-4">
              {selectedProductForVariant.variants && selectedProductForVariant.variants.length > 0 ? (
                selectedProductForVariant.variants.map((variant) => {
                  const storeProduct = storeProducts.find(p => p.id === selectedProductForVariant.id);
                  const stock = storeProduct ? getStockForVariant(storeProduct, variant.id) : 0;
                  const isOutOfStock = stock <= 0;
                  
                  return (
                    <Button
                      key={variant.id}
                      variant="outline"
                      className={`w-full justify-start h-auto p-4 ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5 hover:border-primary/30'
                      }`}
                      onClick={() => {
                        if (!isOutOfStock) {
                          addToCart(selectedProductForVariant.id, variant.id);
                          setShowVariantDialog(false);
                          setSelectedProductForVariant(null);
                        }
                      }}
                      disabled={isOutOfStock}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className="w-8 h-8 rounded border-2 border-primary/20 shrink-0"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{variant.colorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {isOutOfStock ? 'Out of stock' : `${stock} available`}
                          </div>
                        </div>
                        <div className="font-bold text-primary">
                          ₦{selectedProductForVariant.price.toLocaleString()}
                        </div>
                      </div>
                    </Button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No variants available
                </p>
              )}
              {/* Option to add base product without variant if it has stock */}
              {selectedProductForVariant.stock > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/30 mt-3"
                  onClick={() => {
                    addToCart(selectedProductForVariant.id);
                    setShowVariantDialog(false);
                    setSelectedProductForVariant(null);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded border-2 border-primary/20 shrink-0 bg-secondary" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Base Product (No Variant)</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedProductForVariant.stock} available
                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      ₦{selectedProductForVariant.price.toLocaleString()}
                    </div>
                  </div>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

