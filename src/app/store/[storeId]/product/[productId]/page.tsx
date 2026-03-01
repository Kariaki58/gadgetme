"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ChevronLeft, ShoppingCart, ShieldCheck, Truck, PackageCheck } from 'lucide-react';
import { getStorageData } from '@/lib/storage-utils';
import { StoreData, Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useStoreData } from '@/hooks/use-store-data';
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ storeId: string, productId: string }> }) {
  const { storeId, productId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { placeOnlineOrder } = useStoreData();
  const { addToCart, getItemCount } = useCart();
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    const data = getStorageData<StoreData>(`store_${storeId}`);
    if (data) {
      setStore(data);
      const foundProduct = data.products.find(p => p.id === productId);
      if (foundProduct) setProduct(foundProduct);
    }
  }, [storeId, productId]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Use the hook method which handles local state + localstorage properly
    const success = placeOnlineOrder(product.id, checkoutForm.name, checkoutForm.phone, qty);

    if (success) {
      toast({
        title: "Order Placed Successfully!",
        description: `Thank you for your order, ${checkoutForm.name}.`,
      });
      setIsCheckingOut(false);
      // Refresh local display stock
      setProduct(prev => prev ? { ...prev, stock: prev.stock - qty } : null);
    } else {
      toast({
        title: "Stock Error",
        description: "Sorry, this item is out of stock.",
        variant: "destructive"
      });
    }
  };

  if (!product || !store) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
          <Link href={`/store/${storeId}/cart`}>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="aspect-square rounded-3xl bg-white border border-primary/10 shadow-sm flex items-center justify-center overflow-hidden">
              <Smartphone className="h-40 w-40 text-primary/20" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-foreground tracking-tight">{product.name}</h2>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">₦{product.sellingPrice.toLocaleString()}</span>
                {product.stock > 0 ? (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-100 uppercase tracking-widest flex items-center gap-1">
                    <PackageCheck className="h-3 w-3" /> In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold border border-red-100 uppercase tracking-widest">Out of Stock</span>
                )}
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-primary/10 space-y-4 shadow-sm">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description || 'Detailed specifications for this gadget are available upon request.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/50 rounded-2xl flex flex-col items-center text-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Warranty</span>
              </div>
              <div className="p-4 bg-secondary/50 rounded-2xl flex flex-col items-center text-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Fast Delivery</span>
              </div>
              <div className="p-4 bg-secondary/50 rounded-2xl flex flex-col items-center text-center gap-2">
                <Smartphone className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Verified</span>
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Quantity</Label>
                  <div className="flex items-center gap-4 bg-white rounded-xl p-1 border">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      -
                    </Button>
                    <span className="font-bold min-w-[20px] text-center">{qty}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-t border-primary/10">
                  <span className="font-medium text-muted-foreground">Total to pay:</span>
                  <span className="text-2xl font-black text-primary">₦{(product.sellingPrice * qty).toLocaleString()}</span>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90 rounded-2xl" 
                    disabled={product.stock === 0}
                    onClick={() => {
                      addToCart(product, qty);
                      toast({
                        title: "Added to Cart!",
                        description: `${product.name} has been added to your cart.`,
                      });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                  <Button 
                    className="flex-1 h-14 text-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl" 
                    disabled={product.stock === 0}
                    onClick={() => setIsCheckingOut(true)}
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {isCheckingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-3xl">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">Complete Your Purchase</h3>
              <p className="text-muted-foreground mb-6">Enter your contact details to place your order.</p>
              
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cust-name">Full Name</Label>
                  <Input 
                    id="cust-name" 
                    required 
                    value={checkoutForm.name} 
                    onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-phone">Phone Number</Label>
                  <Input 
                    id="cust-phone" 
                    type="tel" 
                    required 
                    value={checkoutForm.phone} 
                    onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} 
                  />
                </div>
                
                <div className="flex gap-4 mt-8">
                  <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsCheckingOut(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-12 bg-primary rounded-xl">
                    Confirm Order
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}