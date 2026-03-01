"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Minus, CreditCard, Copy, Check, MessageCircle, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/cart-context';
import { Badge } from '@/components/ui/badge';
import { getTotalStock } from '@/lib/supabase/transformers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// @ts-ignore - react-select-country-list doesn't have types
import CountrySelect from 'react-select-country-list';

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

export default function CartPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  const countryOptions = CountrySelect().getData();
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  useEffect(() => {
    const loadStoreData = async () => {
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
      } catch (error) {
        console.error('Error loading store:', error);
        toast({
          title: "Error",
          description: "Failed to load store. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId, toast]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || items.length === 0) return;
    // Just show the payment details, don't create order yet
  };

  const handlePaymentCompleted = async () => {
    if (!store || items.length === 0) return;

    try {
      // Create order in database
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: store.id,
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone,
          deliveryAddress: checkoutForm.address,
          deliveryCity: checkoutForm.city,
          deliveryState: checkoutForm.state,
          deliveryCountry: checkoutForm.country,
          items: orderItems,
          totalAmount: getTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      setPaymentCompleted(true);
      // Clear the cart after payment is completed
      clearCart();
      // Show success message
      toast({
        title: "Payment Completed!",
        description: "Your order has been received. Please contact the seller via WhatsApp to complete your order.",
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to save order. Please try again.",
        variant: "destructive",
      });
    }
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
    if (!store || items.length === 0) return '';
    
    const orderItems = items.map(item => 
      `${item.product.name} × ${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const orderDetails = [
      `Order Items:`,
      orderItems,
      `Total Amount: ₦${getTotal().toLocaleString()}`,
      `Customer Name: ${checkoutForm.name}`,
      `Customer Phone: ${checkoutForm.phone}`,
      `Address: ${checkoutForm.address}`,
      `City: ${checkoutForm.city}`,
      `State: ${checkoutForm.state}`,
      `Country: ${checkoutForm.country}`,
    ].join('\n\n');

    const locationDetails = `Here's my location:\n${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.state}, ${checkoutForm.country}`;

    const message = `Hello! I have made an order:\n\n${orderDetails}\n\n${locationDetails}\n\nHow much do you charge for delivery?\n\nHere's my transaction receipt:`;
    
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Store not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isCheckingOut) {
    return (
      <div className="min-h-screen bg-background">
        <header className="p-3 sm:p-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sm sm:text-base lg:text-lg text-primary truncate">{store.storeName}</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-12 sm:py-16 lg:py-20">
          <div className="text-center space-y-3 sm:space-y-4">
            <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto opacity-20" />
            <h2 className="text-xl sm:text-2xl font-bold">Your cart is empty</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Add some items to your cart to get started.</p>
            <Link href={`/store/${storeId}/catalog`}>
              <Button className="mt-3 sm:mt-4 h-10 sm:h-11">Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-3 sm:p-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm sm:text-base lg:text-lg text-primary truncate">{store.storeName}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {!isCheckingOut ? (
          <>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Shopping Cart</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <Card key={item.productId} className="border-primary/10">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-secondary/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                            <img 
                              src={item.product.imageUrls[0]} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 text-primary/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-sm sm:text-base lg:text-lg truncate flex-1">{item.product.name}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-destructive hover:text-destructive shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">{item.product.description}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="font-bold min-w-[24px] sm:min-w-[30px] text-center text-sm sm:text-base">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= getTotalStock(item.product)}
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-lg sm:text-xl font-bold text-primary">₦{(item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">₦{item.price.toLocaleString()} each</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="border-primary/20 lg:sticky lg:top-24">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground truncate pr-2">{item.product.name} × {item.quantity}</span>
                          <span className="font-medium shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between font-bold text-base sm:text-lg">
                        <span>Total</span>
                        <span className="text-primary">₦{getTotal().toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full h-11 sm:h-12 text-sm sm:text-base lg:text-lg bg-primary"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Proceed to Payment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Complete Your Order</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Enter your details and make payment</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
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
                <form onSubmit={handleCheckout} className="space-y-4 sm:space-y-6">
                  <Card className="border-primary/20">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          required
                          value={checkoutForm.address}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                          placeholder="Enter your street address"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            required
                            value={checkoutForm.city}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                            placeholder="Enter your city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            required
                            value={checkoutForm.state}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                            placeholder="Enter your state"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={checkoutForm.country}
                          onValueChange={(value) => setCheckoutForm({ ...checkoutForm, country: value })}
                          required
                        >
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((country: { value: string; label: string }) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seller Account Details */}
                  <Card className="border-primary/20">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                      {store.accountDetails ? (
                        <div className="p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 sm:space-y-4">
                          <h4 className="font-bold text-base sm:text-lg">Transfer Details</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Please transfer <span className="font-bold text-primary">₦{getTotal().toLocaleString()}</span> to the account below:
                          </p>
                          
                          <div className="space-y-3">
                            {store.accountDetails.bankName && (
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Bank Name</Label>
                                <div className="flex items-center justify-between mt-1 gap-2">
                                  <p className="font-bold text-sm sm:text-base truncate flex-1">{store.accountDetails.bankName}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
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
                            )}
                            {store.accountDetails.accountNumber && (
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Account Number</Label>
                                <div className="flex items-center justify-between mt-1 gap-2">
                                  <p className="font-bold text-base sm:text-lg truncate flex-1">{store.accountDetails.accountNumber}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
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
                            )}
                            {store.accountDetails.accountName && (
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Account Name</Label>
                                <div className="flex items-center justify-between mt-1 gap-2">
                                  <p className="font-bold text-sm sm:text-base truncate flex-1">{store.accountDetails.accountName}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
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
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-yellow-800">Payment details not configured. Please contact the store owner.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 sm:h-12 rounded-xl text-sm sm:text-base"
                      onClick={() => {
                        setIsCheckingOut(false);
                        setPaymentCompleted(false);
                      }}
                    >
                      Back to Cart
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 sm:h-12 bg-primary rounded-xl text-sm sm:text-base"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.city || !checkoutForm.state) {
                          toast({
                            title: "Required fields",
                            description: "Please fill in all required fields",
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
              </>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <p className="font-bold text-sm sm:text-base">Payment Completed!</p>
                  </div>
                  <p className="text-xs sm:text-sm text-green-600 mt-2">
                    Now upload your transaction receipt and contact the seller via WhatsApp.
                  </p>
                </div>

                {/* Receipt Upload */}
                <Card className="border-primary/20">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Transaction Receipt</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="border-2 border-dashed rounded-xl p-4 sm:p-6 text-center">
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
                  </CardContent>
                </Card>

                {/* WhatsApp Button */}
                <Button
                  type="button"
                  className="w-full h-11 sm:h-12 bg-green-500 hover:bg-green-600 rounded-xl text-sm sm:text-base"
                  onClick={openWhatsApp}
                  disabled={!store?.whatsappNumber}
                >
                  <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Contact Seller on WhatsApp
                </Button>

                {!store?.whatsappNumber && (
                  <p className="text-xs text-muted-foreground text-center">
                    WhatsApp number not configured by seller
                  </p>
                )}

                {/* Continue Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 rounded-xl text-sm sm:text-base"
                    onClick={() => {
                      router.push(`/store/${storeId}/catalog`);
                    }}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

