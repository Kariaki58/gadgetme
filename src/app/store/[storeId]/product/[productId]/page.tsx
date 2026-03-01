"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ChevronLeft, ShoppingCart, ShieldCheck, Truck, PackageCheck, Copy, Check, MessageCircle, Upload, X } from 'lucide-react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';
import { transformProduct, getTotalStock } from '@/lib/supabase/transformers';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface Store {
  id: string;
  storeId: string;
  storeName: string;
  ownerEmail: string;
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    phoneNumber?: string;
  };
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ storeId: string, productId: string }> }) {
  const { storeId, productId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart, getItemCount } = useCart();
  
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
  });
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch store by storeId (short ID)
        const storeResponse = await fetch(`/api/stores?storeId=${storeId}`);
        if (!storeResponse.ok) {
          throw new Error('Store not found');
        }
        const storeData = await storeResponse.json();
        
        setStore({
          id: storeData.id,
          storeId: storeData.store_id,
          storeName: storeData.store_name,
          ownerEmail: storeData.owner_email,
          accountDetails: storeData.account_bank_name ? {
            bankName: storeData.account_bank_name,
            accountNumber: storeData.account_number,
            accountName: storeData.account_name,
            phoneNumber: storeData.account_phone,
          } : undefined,
          acceptsDelivery: storeData.accepts_delivery || false,
          acceptsPickup: storeData.accepts_pickup !== undefined ? storeData.accepts_pickup : true,
          whatsappNumber: storeData.whatsapp_number,
          address: storeData.address,
          city: storeData.city,
          state: storeData.state,
        });

        // Fetch products for this store
        const productsResponse = await fetch(`/api/products?storeId=${storeData.id}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        
        // Find the specific product
        const foundProduct = productsData.find((p: any) => p.id === productId);
        if (foundProduct) {
          const transformedProduct = transformProduct(foundProduct);
          setProduct(transformedProduct);
        } else {
          toast({
            title: "Product not found",
            description: "The product you're looking for doesn't exist.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: "Error",
          description: "Failed to load product. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId, productId, toast]);

  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !store) return;
    // Just show the payment details, don't create order yet
  };

  const handlePaymentCompleted = () => {
    setPaymentCompleted(true);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!product || !store) return '';
    
    const orderDetails = [
      `Product: ${product.name}`,
      `Quantity: ${qty}`,
      `Total Amount: ₦${(product.sellingPrice * qty).toLocaleString()}`,
      `Customer Name: ${checkoutForm.name}`,
      `Customer Phone: ${checkoutForm.phone}`,
    ].join('\n');

    const message = `Hello! I have made an order:\n\n${orderDetails}\n\nHere's my transaction receipt:`;
    
    return encodeURIComponent(message);
  };

  const openWhatsApp = () => {
    if (!store?.whatsappNumber) {
      toast({
        title: "WhatsApp not configured",
        description: "The seller hasn't set up their WhatsApp number yet.",
        variant: "destructive",
      });
      return;
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    return getTotalStock(product);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-medium text-muted-foreground">Product not found</h2>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const availableStock = getAvailableStock();

  const scrollTo = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

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
          <div className="space-y-4">
            {/* Product Images Carousel */}
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <Carousel 
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  setApi={setCarouselApi}
                >
                  <CarouselContent>
                    {product.imageUrls.map((url, idx) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-square rounded-3xl bg-white border border-primary/10 shadow-lg overflow-hidden">
                          <img 
                            src={url} 
                            alt={`${product.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {product.imageUrls.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 bg-white/90 hover:bg-white border-primary/30 shadow-lg" />
                      <CarouselNext className="right-2 bg-white/90 hover:bg-white border-primary/30 shadow-lg" />
                    </>
                  )}
                </Carousel>
                {/* Thumbnail Navigation */}
                {product.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {product.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollTo(idx)}
                        type="button"
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx
                            ? 'border-primary shadow-md scale-105'
                            : 'border-primary/20 hover:border-primary/40'
                        }`}
                      >
                        <img 
                          src={url} 
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-3xl bg-white border border-primary/10 shadow-sm flex items-center justify-center">
                <Smartphone className="h-40 w-40 text-primary/20" />
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-foreground tracking-tight">{product.name}</h2>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">₦{product.sellingPrice.toLocaleString()}</span>
                {availableStock > 0 ? (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-100 uppercase tracking-widest flex items-center gap-1">
                    <PackageCheck className="h-3 w-3" /> In Stock ({availableStock})
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

            {/* Color Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="p-6 bg-white rounded-2xl border border-primary/10 space-y-4 shadow-sm">
                <Label className="text-lg font-bold">Available Colors</Label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                      <span className="text-sm font-medium">{variant.colorName}</span>
                      <span className="text-xs text-muted-foreground">({variant.stock} in stock)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      onClick={() => setQty(Math.min(availableStock, qty + 1))}
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
                    disabled={availableStock === 0}
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
                    disabled={availableStock === 0}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl rounded-3xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Complete Your Purchase</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsCheckingOut(false);
                    setPaymentCompleted(false);
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {!paymentCompleted ? (
                <>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="space-y-4">
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
                    </div>

                    {/* Seller Account Details */}
                    {store && (store as any).accountDetails && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
                        <h4 className="font-bold text-lg">Payment Details</h4>
                        <p className="text-sm text-muted-foreground">
                          Please transfer <span className="font-bold text-primary">₦{(product.sellingPrice * qty).toLocaleString()}</span> to the account below:
                        </p>
                        
                        <div className="space-y-3">
                          {(store as any).accountDetails.bankName && (
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase">Bank Name</Label>
                              <p className="font-bold">{((store as any).accountDetails as any).bankName}</p>
                            </div>
                          )}
                          {(store as any).accountDetails.accountNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase">Account Number</Label>
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-lg">{((store as any).accountDetails as any).accountNumber}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    navigator.clipboard.writeText(((store as any).accountDetails as any).accountNumber);
                                    toast({
                                      title: "Copied!",
                                      description: "Account number copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {(store as any).accountDetails.accountName && (
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase">Account Name</Label>
                              <div className="flex items-center justify-between">
                                <p className="font-bold">{((store as any).accountDetails as any).accountName}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    navigator.clipboard.writeText(((store as any).accountDetails as any).accountName);
                                    toast({
                                      title: "Copied!",
                                      description: "Account name copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 h-12 rounded-xl" 
                        onClick={() => {
                          setIsCheckingOut(false);
                          setPaymentCompleted(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 h-12 bg-primary rounded-xl"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!checkoutForm.name || !checkoutForm.phone) {
                            toast({
                              title: "Required fields",
                              description: "Please fill in your name and phone number",
                              variant: "destructive",
                            });
                            return;
                          }
                          handleCheckout(e);
                        }}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </form>

                  {/* Payment Completed Section - shown after clicking Continue */}
                  {checkoutForm.name && checkoutForm.phone && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <Button
                        type="button"
                        className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl"
                        onClick={handlePaymentCompleted}
                      >
                        <Check className="mr-2 h-5 w-5" />
                        I Have Completed Payment
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="h-5 w-5" />
                      <p className="font-bold">Payment Completed!</p>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      Now upload your transaction receipt and contact the seller via WhatsApp.
                    </p>
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label>Transaction Receipt</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center">
                      {receiptPreview ? (
                        <div className="space-y-4">
                          <img 
                            src={receiptPreview} 
                            alt="Receipt preview" 
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReceiptFile(null);
                                setReceiptPreview(null);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <div>
                            <Label htmlFor="receipt-upload" className="cursor-pointer">
                              <span className="text-primary font-medium">Click to upload</span> or drag and drop
                            </Label>
                            <Input
                              id="receipt-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleReceiptUpload}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <Button
                    type="button"
                    className="w-full h-12 bg-green-500 hover:bg-green-600 rounded-xl"
                    onClick={openWhatsApp}
                    disabled={!store?.whatsappNumber}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Seller on WhatsApp
                  </Button>

                  {!store?.whatsappNumber && (
                    <p className="text-xs text-muted-foreground text-center">
                      WhatsApp number not configured by seller
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
