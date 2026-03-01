"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Minus, CreditCard, Copy, Check } from 'lucide-react';
import { getStorageData } from '@/lib/storage-utils';
import { StoreData } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useStoreData } from '@/hooks/use-store-data';
import { useCart } from '@/contexts/cart-context';
import { Badge } from '@/components/ui/badge';

export default function CartPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { placeCartOrder } = useStoreData();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const [store, setStore] = useState<StoreData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    setMounted(true);
    const data = getStorageData<StoreData>(`store_${storeId}`);
    if (data) setStore(data);
  }, [storeId]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || items.length === 0) return;

    const cartItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const success = placeCartOrder(cartItems, checkoutForm.name, checkoutForm.phone);

    if (success) {
      toast({
        title: "Order Placed!",
        description: "Your order has been placed. Please make payment to complete your purchase.",
      });
      clearCart();
      setIsCheckingOut(false);
      router.push(`/store/${storeId}/catalog`);
    } else {
      toast({
        title: "Error",
        description: "Some items are out of stock. Please update your cart.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!mounted || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShoppingCart className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isCheckingOut) {
    return (
      <div className="min-h-screen bg-background">
        <header className="p-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-primary truncate">{store.storeName}</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Add some items to your cart to get started.</p>
            <Link href={`/store/${storeId}/catalog`}>
              <Button className="mt-4">Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-primary truncate">{store.storeName}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isCheckingOut ? (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold">Shopping Cart</h2>
              <p className="text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.productId} className="border-primary/10">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-secondary/50 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-12 w-12 text-primary/20" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.product.description}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold min-w-[30px] text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">₦{(item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">₦{item.price.toLocaleString()} each</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="border-primary/20 sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                          <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">₦{getTotal().toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 text-lg bg-primary"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      <CreditCard className="mr-2 h-5 w-5" /> Proceed to Payment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Complete Your Order</h2>
                <p className="text-muted-foreground">Enter your details and make payment</p>
              </div>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {store.accountDetails ? (
                    <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-primary/10">
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Bank Name</Label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-bold">{store.accountDetails.bankName}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(store.accountDetails!.bankName, 'Bank Name')}
                          >
                            {copiedField === 'Bank Name' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Account Number</Label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-bold text-lg">{store.accountDetails.accountNumber}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(store.accountDetails!.accountNumber, 'Account Number')}
                          >
                            {copiedField === 'Account Number' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Account Name</Label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-bold">{store.accountDetails.accountName}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(store.accountDetails!.accountName, 'Account Name')}
                          >
                            {copiedField === 'Account Name' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {store.accountDetails.phoneNumber && (
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase">Phone Number</Label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-bold">{store.accountDetails.phoneNumber}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(store.accountDetails!.phoneNumber!, 'Phone Number')}
                            >
                              {copiedField === 'Phone Number' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">Payment details not configured. Please contact the store owner.</p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">After making the transfer, your order will be pending until the store owner confirms payment.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsCheckingOut(false)}
                      >
                        Back to Cart
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-primary"
                        disabled={!store.accountDetails}
                      >
                        Place Order
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
        )}
      </main>
    </div>
  );
}

