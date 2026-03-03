"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Minus, CreditCard, Copy, Check, MessageCircle, Upload, X, Loader2, Download, Package, Truck } from 'lucide-react';
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
import jsPDF from 'jspdf';

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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<Array<any>>([]);
  const [receiptCheckoutForm, setReceiptCheckoutForm] = useState<any>(null);
  
  const countryOptions = CountrySelect().getData();
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    deliveryMethod: 'delivery' as 'pickup' | 'delivery',
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
    
    // Validate required fields
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.city || !checkoutForm.state) {
      toast({
        title: "Required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Form is valid - payment details are shown and "I Have Completed Payment" button will appear
    // User needs to complete payment externally first, then click the button
    toast({
      title: "Payment Details Ready",
      description: "Please complete the transfer and click 'I Have Completed Payment' when done.",
    });
  };

  const handlePaymentCompleted = async () => {
    if (!store || items.length === 0) return;

    try {
      // Create order in database
      const orderItems = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
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
          deliveryAddress: checkoutForm.deliveryMethod === 'delivery' ? checkoutForm.address : null,
          deliveryCity: checkoutForm.deliveryMethod === 'delivery' ? checkoutForm.city : null,
          deliveryState: checkoutForm.deliveryMethod === 'delivery' ? checkoutForm.state : null,
          deliveryCountry: checkoutForm.deliveryMethod === 'delivery' ? checkoutForm.country : null,
          deliveryMethod: checkoutForm.deliveryMethod,
          items: orderItems,
          totalAmount: getTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      setOrderId(data.orderId);
      
      // Save items and form data for receipt before clearing cart
      setReceiptItems([...items]);
      setReceiptCheckoutForm({ ...checkoutForm });
      
      setPaymentCompleted(true);
      setShowReceipt(true);
      
      // Clear the cart after payment is completed
      clearCart();
      
      // Open WhatsApp with pre-filled message
      openWhatsApp();
      
      // Show success message
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been created. Opening WhatsApp to contact the seller.",
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
    
    const orderItems = items.map(item => {
      const variant = item.variantId && item.product.variants 
        ? item.product.variants.find(v => v.id === item.variantId)
        : null;
      const variantText = variant ? ` (${variant.colorName})` : '';
      return `${item.product.name}${variantText} × ${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}`;
    }).join('\n');

    const deliveryInfo = checkoutForm.deliveryMethod === 'delivery' 
      ? `Delivery Address:\n${checkoutForm.address}\n${checkoutForm.city}, ${checkoutForm.state}\n${checkoutForm.country}`
      : 'Pickup: I will pick up from your store';

    const orderDetails = [
      `Order Items:`,
      orderItems,
      `Total Amount: ₦${getTotal().toLocaleString()}`,
      `Customer Name: ${checkoutForm.name}`,
      `Customer Phone: ${checkoutForm.phone}`,
      `Delivery Method: ${checkoutForm.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}`,
      deliveryInfo,
    ].join('\n\n');

    const message = `Hello! I have made an order:\n\n${orderDetails}\n\n${checkoutForm.deliveryMethod === 'delivery' ? 'How much do you charge for delivery?' : 'When can I pick up my order?'}\n\nHere's my transaction receipt:`;
    
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


  // Order Receipt Component
  const OrderReceipt = ({ 
    orderId, 
    store, 
    items, 
    checkoutForm, 
    totalAmount, 
    onDownloadPDF, 
    onContinueShopping 
  }: {
    orderId: string;
    store: Store | null;
    items: Array<any>;
    checkoutForm: any;
    totalAmount: number;
    onDownloadPDF: () => void;
    onContinueShopping: () => void;
  }) => {
    if (!store) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <p className="font-bold text-sm sm:text-base">Order Placed Successfully!</p>
          </div>
          <p className="text-xs sm:text-sm text-green-600 mt-2">
            Your order has been created and WhatsApp has been opened. You can download your receipt below.
          </p>
        </div>

        {/* Receipt */}
        <Card className="border-primary/20 bg-white">
          <CardHeader className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">Order Receipt</CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Order Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Pending
                </Badge>
              </div>
            </div>

            {/* Customer Info */}
            <div className="pt-4 border-t space-y-2">
              <h3 className="font-bold text-sm">Customer Information</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {checkoutForm.name}</p>
                <p><span className="text-muted-foreground">Phone:</span> {checkoutForm.phone}</p>
                <p><span className="text-muted-foreground">Delivery Method:</span> {checkoutForm.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                {checkoutForm.deliveryMethod === 'delivery' && (
                  <>
                    <p><span className="text-muted-foreground">Address:</span> {checkoutForm.address}</p>
                    <p><span className="text-muted-foreground">City:</span> {checkoutForm.city}, {checkoutForm.state}</p>
                    <p><span className="text-muted-foreground">Country:</span> {checkoutForm.country}</p>
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-bold text-sm">Order Items</h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const variant = item.variantId && item.product.variants 
                    ? item.product.variants.find(v => v.id === item.variantId)
                    : null;
                  return (
                    <div key={`${item.productId}-${item.variantId || 'base'}`} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {variant && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div 
                              className="w-3 h-3 rounded border shrink-0"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                            <span className="text-xs text-muted-foreground">{variant.colorName}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">₦{item.price.toLocaleString()} each</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-xl text-primary">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-medium mb-2">💾 Save Your Receipt</p>
            <p className="text-xs text-blue-700">Download your order receipt as a PDF for your records.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 sm:h-12 border-2 border-primary hover:bg-primary hover:text-white"
              onClick={onDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt (PDF)
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 sm:h-12 bg-primary"
              onClick={onContinueShopping}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
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
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm sm:text-base lg:text-lg truncate">{item.product.name}</h3>
                              {item.variantId && item.product.variants && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div 
                                    className="w-4 h-4 rounded border shrink-0"
                                    style={{ 
                                      backgroundColor: item.product.variants.find(v => v.id === item.variantId)?.colorHex 
                                    }}
                                  />
                                  <span className="text-xs sm:text-sm text-muted-foreground">
                                    {item.product.variants.find(v => v.id === item.variantId)?.colorName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.productId, item.variantId)}
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
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="font-bold min-w-[24px] sm:min-w-[30px] text-center text-sm sm:text-base">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                disabled={item.quantity >= (item.variantId ? (item.product.variants?.find(v => v.id === item.variantId)?.stock || 0) : item.product.baseStock)}
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
                      {items.map((item) => {
                        const variant = item.variantId && item.product.variants 
                          ? item.product.variants.find(v => v.id === item.variantId)
                          : null;
                        return (
                          <div key={`${item.productId}-${item.variantId || 'base'}`} className="flex justify-between text-xs sm:text-sm">
                            <div className="text-muted-foreground truncate pr-2 flex-1 min-w-0">
                              <div className="truncate">{item.product.name} × {item.quantity}</div>
                              {variant && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div 
                                    className="w-3 h-3 rounded border shrink-0"
                                    style={{ backgroundColor: variant.colorHex }}
                                  />
                                  <span className="text-[10px]">{variant.colorName}</span>
                                </div>
                              )}
                            </div>
                            <span className="font-medium shrink-0 ml-2">₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        );
                      })}
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
                        <Label>Delivery Method</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setCheckoutForm({ ...checkoutForm, deliveryMethod: 'delivery' })}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              checkoutForm.deliveryMethod === 'delivery'
                                ? 'border-primary bg-primary/5'
                                : 'border-primary/20 hover:border-primary/40'
                            }`}
                          >
                            <Truck className={`h-5 w-5 ${checkoutForm.deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="text-left">
                              <div className={`font-medium ${checkoutForm.deliveryMethod === 'delivery' ? 'text-primary' : ''}`}>Delivery</div>
                              <div className="text-xs text-muted-foreground">Ship to my address</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutForm({ ...checkoutForm, deliveryMethod: 'pickup' })}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              checkoutForm.deliveryMethod === 'pickup'
                                ? 'border-primary bg-primary/5'
                                : 'border-primary/20 hover:border-primary/40'
                            }`}
                          >
                            <Package className={`h-5 w-5 ${checkoutForm.deliveryMethod === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="text-left">
                              <div className={`font-medium ${checkoutForm.deliveryMethod === 'pickup' ? 'text-primary' : ''}`}>Pickup</div>
                              <div className="text-xs text-muted-foreground">Collect from store</div>
                            </div>
                          </button>
                        </div>
                      </div>
                      {checkoutForm.deliveryMethod === 'delivery' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              required={checkoutForm.deliveryMethod === 'delivery'}
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
                                required={checkoutForm.deliveryMethod === 'delivery'}
                                value={checkoutForm.city}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                                placeholder="Enter your city"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                required={checkoutForm.deliveryMethod === 'delivery'}
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
                              required={checkoutForm.deliveryMethod === 'delivery'}
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
                        </>
                      )}
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
                        const isDelivery = checkoutForm.deliveryMethod === 'delivery';
                        const hasRequiredFields = checkoutForm.name && checkoutForm.phone && 
                          (!isDelivery || (checkoutForm.address && checkoutForm.city && checkoutForm.state));
                        if (!hasRequiredFields) {
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

                {/* Payment Completed Section - shown after clicking Continue */}
                {(() => {
                  const isDelivery = checkoutForm.deliveryMethod === 'delivery';
                  const hasRequiredFields = checkoutForm.name && checkoutForm.phone && 
                    (!isDelivery || (checkoutForm.address && checkoutForm.city && checkoutForm.state));
                  return hasRequiredFields && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <Button
                        type="button"
                        className="w-full h-11 sm:h-12 bg-green-600 hover:bg-green-700 rounded-xl text-sm sm:text-base"
                        onClick={handlePaymentCompleted}
                      >
                        <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        I Have Made the Payment
                      </Button>
                    </div>
                  );
                })()}
              </>
            ) : showReceipt && orderId && receiptItems.length > 0 ? (
              <OrderReceipt
                orderId={orderId}
                store={store}
                items={receiptItems}
                checkoutForm={receiptCheckoutForm}
                totalAmount={receiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                onDownloadPDF={() => {
                  // Temporarily set items for PDF generation
                  const tempItems = receiptItems;
                  const tempTotal = receiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const doc = new jsPDF();
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const margin = 20;
                  let yPos = margin;

                  // Header
                  doc.setFontSize(20);
                  doc.setTextColor(100, 100, 255);
                  doc.text('ORDER RECEIPT', pageWidth / 2, yPos, { align: 'center' });
                  yPos += 10;

                  doc.setFontSize(10);
                  doc.setTextColor(100, 100, 100);
                  doc.text(store?.storeName || '', pageWidth / 2, yPos, { align: 'center' });
                  yPos += 15;

                  // Order Info
                  doc.setFontSize(12);
                  doc.setTextColor(0, 0, 0);
                  doc.text(`Order ID: ${orderId.slice(0, 8).toUpperCase()}`, margin, yPos);
                  yPos += 7;
                  doc.setFontSize(10);
                  doc.text(`Date: ${new Date().toLocaleString()}`, margin, yPos);
                  yPos += 7;
                  doc.text(`Status: Pending`, margin, yPos);
                  yPos += 15;

                  // Customer Info
                  doc.setFontSize(12);
                  doc.setTextColor(0, 0, 0);
                  doc.text('Customer Information', margin, yPos);
                  yPos += 7;
                  doc.setFontSize(10);
                  doc.text(`Name: ${receiptCheckoutForm.name}`, margin, yPos);
                  yPos += 6;
                  doc.text(`Phone: ${receiptCheckoutForm.phone}`, margin, yPos);
                  yPos += 6;
                  doc.text(`Delivery Method: ${receiptCheckoutForm.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}`, margin, yPos);
                  yPos += 6;
                  if (receiptCheckoutForm.deliveryMethod === 'delivery') {
                    doc.text(`Address: ${receiptCheckoutForm.address}`, margin, yPos);
                    yPos += 6;
                    doc.text(`${receiptCheckoutForm.city}, ${receiptCheckoutForm.state}`, margin, yPos);
                    yPos += 6;
                    doc.text(receiptCheckoutForm.country, margin, yPos);
                  }
                  yPos += 10;

                  // Items
                  doc.setFontSize(12);
                  doc.text('Order Items', margin, yPos);
                  yPos += 7;
                  doc.setFontSize(10);
                  
                  tempItems.forEach((item) => {
                    const variant = item.variantId && item.product.variants 
                      ? item.product.variants.find((v: any) => v.id === item.variantId)
                      : null;
                    const variantText = variant ? ` (${variant.colorName})` : '';
                    const itemText = `${item.product.name}${variantText} × ${item.quantity}`;
                    const priceText = `₦${(item.price * item.quantity).toLocaleString()}`;
                    
                    doc.text(itemText, margin, yPos);
                    doc.text(priceText, pageWidth - margin, yPos, { align: 'right' });
                    yPos += 6;
                  });

                  yPos += 5;
                  doc.setDrawColor(200, 200, 200);
                  doc.line(margin, yPos, pageWidth - margin, yPos);
                  yPos += 8;

                  // Total
                  doc.setFontSize(12);
                  doc.setFont(undefined, 'bold');
                  doc.text('Total Amount:', margin, yPos);
                  doc.text(`₦${tempTotal.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
                  yPos += 15;

                  // Footer
                  doc.setFontSize(9);
                  doc.setFont(undefined, 'normal');
                  doc.setTextColor(150, 150, 150);
                  doc.text('Thank you for your order!', pageWidth / 2, yPos, { align: 'center' });
                  yPos += 5;
                  doc.text('Please contact the seller via WhatsApp for order updates.', pageWidth / 2, yPos, { align: 'center' });

                  // Save PDF
                  doc.save(`order-receipt-${orderId.slice(0, 8)}.pdf`);
                }}
                onContinueShopping={() => router.push(`/store/${storeId}/catalog`)}
              />
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

