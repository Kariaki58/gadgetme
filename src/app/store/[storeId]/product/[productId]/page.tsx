"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ChevronLeft, ShoppingCart, ShieldCheck, Truck, PackageCheck, Copy, Check, MessageCircle, Upload, X, Package, Loader2, Download } from 'lucide-react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';
import { transformProduct, getTotalStock, getStockForVariant } from '@/lib/supabase/transformers';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    deliveryMethod: 'delivery' as 'pickup' | 'delivery',
  });
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptProduct, setReceiptProduct] = useState<Product | null>(null);
  const [receiptCheckoutForm, setReceiptCheckoutForm] = useState<any>(null);

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

  const handlePaymentCompleted = async () => {
    if (!product || !store || isProcessingPayment) return;

    setIsProcessingPayment(true);

    try {
      // Create order in database
      const orderItems = [{
        productId: product.id,
        variantId: selectedVariantId,
        quantity: qty,
        price: product.sellingPrice,
      }];

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
          totalAmount: product.sellingPrice * qty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      setOrderId(data.orderId);
      
      // Save product and form data for receipt before clearing
      setReceiptProduct(product);
      setReceiptCheckoutForm({ ...checkoutForm });
      
      setPaymentCompleted(true);
      setShowReceipt(true);
      
      // Open WhatsApp with pre-filled message
      openWhatsApp();
      
      // Show success message
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been created. Opening WhatsApp to contact the seller.",
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
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
    if (!product || !store) return '';
    
    const selectedVariant = selectedVariantId 
      ? product.variants?.find(v => v.id === selectedVariantId)
      : null;
    
    const deliveryInfo = checkoutForm.deliveryMethod === 'delivery' 
      ? `Delivery Address:\n${checkoutForm.address}\n${checkoutForm.city}, ${checkoutForm.state}\n${checkoutForm.country}`
      : 'Pickup: I will pick up from your store';
    
    const orderDetails = [
      `Product: ${product.name}${selectedVariant ? ` (${selectedVariant.colorName})` : ''}`,
      `Quantity: ${qty}`,
      `Total Amount: ₦${(product.sellingPrice * qty).toLocaleString()}`,
      `Customer Name: ${checkoutForm.name}`,
      `Customer Phone: ${checkoutForm.phone}`,
      `Delivery Method: ${checkoutForm.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}`,
      deliveryInfo,
    ].join('\n');

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

  const downloadReceiptPDF = () => {
    if (!receiptProduct || !orderId || !receiptCheckoutForm) return;

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
      yPos += 6;
    }
    yPos += 5;

    // Items
    doc.setFontSize(12);
    doc.text('Order Items', margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    
    const selectedVariant = selectedVariantId && receiptProduct.variants 
      ? receiptProduct.variants.find(v => v.id === selectedVariantId)
      : null;
    const variantText = selectedVariant ? ` (${selectedVariant.colorName})` : '';
    const itemText = `${receiptProduct.name}${variantText} × ${qty}`;
    const priceText = `₦${(receiptProduct.sellingPrice * qty).toLocaleString()}`;
    
    doc.text(itemText, margin, yPos);
    doc.text(priceText, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Total
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', margin, yPos);
    doc.text(`₦${(receiptProduct.sellingPrice * qty).toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
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
  };

  // Order Receipt Component
  const OrderReceipt = () => {
    if (!store || !receiptProduct || !orderId || !receiptCheckoutForm) return null;

    const selectedVariant = selectedVariantId && receiptProduct.variants 
      ? receiptProduct.variants.find(v => v.id === selectedVariantId)
      : null;

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
                <p><span className="text-muted-foreground">Name:</span> {receiptCheckoutForm.name}</p>
                <p><span className="text-muted-foreground">Phone:</span> {receiptCheckoutForm.phone}</p>
                <p><span className="text-muted-foreground">Delivery Method:</span> {receiptCheckoutForm.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                {receiptCheckoutForm.deliveryMethod === 'delivery' && (
                  <>
                    <p><span className="text-muted-foreground">Address:</span> {receiptCheckoutForm.address}</p>
                    <p><span className="text-muted-foreground">City:</span> {receiptCheckoutForm.city}, {receiptCheckoutForm.state}</p>
                    <p><span className="text-muted-foreground">Country:</span> {receiptCheckoutForm.country}</p>
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-bold text-sm">Order Items</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{receiptProduct.name}</p>
                    {selectedVariant && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div 
                          className="w-3 h-3 rounded border shrink-0"
                          style={{ backgroundColor: selectedVariant.colorHex }}
                        />
                        <span className="text-xs text-muted-foreground">{selectedVariant.colorName}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">× {qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{(receiptProduct.sellingPrice * qty).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">₦{receiptProduct.sellingPrice.toLocaleString()} each</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount:</span>
                <span className="font-bold text-xl text-primary">₦{(receiptProduct.sellingPrice * qty).toLocaleString()}</span>
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
              onClick={downloadReceiptPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt (PDF)
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 sm:h-12 bg-primary"
              onClick={() => router.push(`/store/${storeId}/catalog`)}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    if (selectedVariantId) {
      return getStockForVariant(product, selectedVariantId);
    }
    return product.baseStock;
  };

  const hasVariants = product && product.variants && Array.isArray(product.variants) && product.variants.length > 0;
  const isVariantRequired = hasVariants && !selectedVariantId;

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
      <header className="p-3 sm:p-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm sm:text-base lg:text-lg text-primary truncate">{store.storeName}</h1>
          </div>
          <Link href={`/store/${storeId}/cart`}>
            <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
          <div className="space-y-3 sm:space-y-4">
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
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
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

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">{product.name}</h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl font-bold text-primary">₦{product.sellingPrice.toLocaleString()}</span>
                {availableStock > 0 ? (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-100 uppercase tracking-widest flex items-center gap-1">
                    <PackageCheck className="h-3 w-3" /> In Stock ({availableStock})
                  </span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold border border-red-100 uppercase tracking-widest">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Description in Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description" className="border border-primary/10 rounded-2xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-4 sm:px-6 py-4 sm:py-5 hover:no-underline">
                  <span className="text-base sm:text-lg font-bold">Product Description</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description || 'Detailed specifications for this gadget are available upon request.'}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Color Variants - Required Selection */}
            {hasVariants && (
              <div className="p-4 sm:p-6 bg-white rounded-2xl border border-primary/10 space-y-4 shadow-sm">
                <Label className="text-base sm:text-lg font-bold">
                  Select Color <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariantId === variant.id;
                    const isOutOfStock = variant.stock === 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          if (!isOutOfStock) {
                            setSelectedVariantId(variant.id);
                            setQty(1); // Reset quantity when variant changes
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md scale-105'
                            : isOutOfStock
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-primary/10 hover:border-primary/30 cursor-pointer'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded border"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-xs sm:text-sm font-medium">{variant.colorName}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {isOutOfStock ? 'Out of stock' : `(${variant.stock} in stock)`}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {isVariantRequired && (
                  <p className="text-xs sm:text-sm text-red-500 font-medium">
                    Please select a color variant before adding to cart
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl sm:rounded-2xl flex flex-col items-center text-center gap-1 sm:gap-2">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground">Warranty</span>
              </div>
              <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl sm:rounded-2xl flex flex-col items-center text-center gap-1 sm:gap-2">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground">Fast Delivery</span>
              </div>
              <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl sm:rounded-2xl flex flex-col items-center text-center gap-1 sm:gap-2">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground">Verified</span>
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden rounded-2xl sm:rounded-3xl">
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base sm:text-lg font-bold">Quantity</Label>
                  <div className="flex items-center gap-3 sm:gap-4 bg-white rounded-xl p-1 border">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      -
                    </Button>
                    <span className="font-bold min-w-[20px] text-center text-sm sm:text-base">{qty}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                      onClick={() => setQty(Math.min(availableStock, qty + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-t border-primary/10">
                  <span className="font-medium text-sm sm:text-base text-muted-foreground">Total to pay:</span>
                  <span className="text-xl sm:text-2xl font-black text-primary">₦{(product.sellingPrice * qty).toLocaleString()}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90 rounded-xl sm:rounded-2xl" 
                    disabled={availableStock === 0 || isVariantRequired}
                    onClick={() => {
                      if (isVariantRequired) {
                        toast({
                          title: "Variant Required",
                          description: "Please select a color variant before adding to cart.",
                          variant: "destructive",
                        });
                        return;
                      }
                      addToCart(product, qty, selectedVariantId);
                      toast({
                        title: "Added to Cart!",
                        description: `${product.name}${selectedVariantId ? ` (${product.variants?.find(v => v.id === selectedVariantId)?.colorName})` : ''} has been added to your cart.`,
                      });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add to Cart
                  </Button>
                  <Button 
                    className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl sm:rounded-2xl" 
                    disabled={availableStock === 0 || isVariantRequired}
                    onClick={() => {
                      if (isVariantRequired) {
                        toast({
                          title: "Variant Required",
                          description: "Please select a color variant before proceeding.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setIsCheckingOut(true);
                    }}
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8 sm:py-12">
            <Card className="w-full max-w-2xl rounded-3xl my-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold">Complete Your Purchase</h3>
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

                    {/* Delivery Method Selection */}
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
                            <div className={`font-medium text-sm ${checkoutForm.deliveryMethod === 'delivery' ? 'text-primary' : ''}`}>Delivery</div>
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
                            <div className={`font-medium text-sm ${checkoutForm.deliveryMethod === 'pickup' ? 'text-primary' : ''}`}>Pickup</div>
                            <div className="text-xs text-muted-foreground">Pick up from store</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Address Fields - shown only for delivery */}
                    {checkoutForm.deliveryMethod === 'delivery' && (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input 
                            id="address" 
                            required={checkoutForm.deliveryMethod === 'delivery'}
                            value={checkoutForm.address} 
                            onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} 
                            placeholder="Street address"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city" 
                              required={checkoutForm.deliveryMethod === 'delivery'}
                              value={checkoutForm.city} 
                              onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})} 
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input 
                              id="state" 
                              required={checkoutForm.deliveryMethod === 'delivery'}
                              value={checkoutForm.state} 
                              onChange={e => setCheckoutForm({...checkoutForm, state: e.target.value})} 
                              placeholder="State"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country" 
                            required={checkoutForm.deliveryMethod === 'delivery'}
                            value={checkoutForm.country} 
                            onChange={e => setCheckoutForm({...checkoutForm, country: e.target.value})} 
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    )}

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
                          if (checkoutForm.deliveryMethod === 'delivery' && (!checkoutForm.address || !checkoutForm.city || !checkoutForm.state || !checkoutForm.country)) {
                            toast({
                              title: "Delivery address required",
                              description: "Please fill in all delivery address fields",
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
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-5 w-5" />
                            I Have Made the Payment
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                showReceipt ? (
                  <OrderReceipt />
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
                )
              )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
