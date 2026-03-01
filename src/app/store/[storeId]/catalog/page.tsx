"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Smartphone, Search, Filter, ShoppingBag, Package } from 'lucide-react';
import { getStorageData, setStorageData, generateId } from '@/lib/storage-utils';
import { StoreData, Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';

export default function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [store, setStore] = useState<StoreData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mounted, setMounted] = useState(false);
  const { getItemCount, addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const data = getStorageData<StoreData>(`store_${storeId}`);
    if (data) {
      // If store has no products, seed with dummy data
      if (data.products.length === 0) {
        const dummyProducts: Product[] = [
          {
            id: generateId(),
            name: 'iPhone 15 Pro Max',
            description: 'Latest flagship smartphone with A17 Pro chip, 6.7-inch Super Retina XDR display, and advanced camera system. Perfect for photography enthusiasts and power users.',
            category: 'Smartphones',
            costPrice: 850000,
            sellingPrice: 1200000,
            stock: 15,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Samsung Galaxy S24 Ultra',
            description: 'Premium Android device with S Pen, 200MP camera, and Snapdragon 8 Gen 3. Ideal for productivity and creative work.',
            category: 'Smartphones',
            costPrice: 780000,
            sellingPrice: 1100000,
            stock: 12,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'MacBook Pro 16" M3',
            description: 'Powerful laptop with M3 chip, 16GB RAM, and stunning Liquid Retina XDR display. Perfect for professionals and content creators.',
            category: 'Laptops',
            costPrice: 1800000,
            sellingPrice: 2500000,
            stock: 8,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Dell XPS 15',
            description: 'Premium Windows laptop with Intel Core i7, 16GB RAM, and 4K OLED display. Great for business and creative professionals.',
            category: 'Laptops',
            costPrice: 1200000,
            sellingPrice: 1650000,
            stock: 10,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'AirPods Pro (2nd Gen)',
            description: 'Active Noise Cancellation, Spatial Audio, and Adaptive EQ. Premium wireless earbuds with exceptional sound quality.',
            category: 'Audio',
            costPrice: 85000,
            sellingPrice: 120000,
            stock: 25,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Sony WH-1000XM5',
            description: 'Industry-leading noise cancellation headphones with 30-hour battery life and premium sound quality. Perfect for travel and work.',
            category: 'Audio',
            costPrice: 95000,
            sellingPrice: 135000,
            stock: 18,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'iPad Pro 12.9" M2',
            description: 'Powerful tablet with M2 chip, 12.9-inch Liquid Retina XDR display, and Apple Pencil support. Ideal for artists and professionals.',
            category: 'Tablets',
            costPrice: 650000,
            sellingPrice: 890000,
            stock: 14,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Samsung Galaxy Tab S9 Ultra',
            description: 'Premium Android tablet with S Pen, 14.6-inch AMOLED display, and Snapdragon 8 Gen 2. Great for multitasking and creativity.',
            category: 'Tablets',
            costPrice: 580000,
            sellingPrice: 780000,
            stock: 11,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Apple Watch Ultra 2',
            description: 'Rugged smartwatch with titanium case, advanced fitness tracking, and 36-hour battery life. Perfect for athletes and adventurers.',
            category: 'Wearables',
            costPrice: 320000,
            sellingPrice: 450000,
            stock: 20,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Samsung Galaxy Watch 6 Classic',
            description: 'Premium smartwatch with rotating bezel, advanced health monitoring, and 40-hour battery life. Stylish and functional.',
            category: 'Wearables',
            costPrice: 180000,
            sellingPrice: 250000,
            stock: 22,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Nintendo Switch OLED',
            description: 'Gaming console with 7-inch OLED screen, enhanced audio, and 64GB internal storage. Perfect for gaming on the go.',
            category: 'Gaming',
            costPrice: 180000,
            sellingPrice: 250000,
            stock: 16,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'PlayStation 5',
            description: 'Next-gen gaming console with ray tracing, 4K gaming, and lightning-fast SSD. Includes DualSense wireless controller.',
            category: 'Gaming',
            costPrice: 320000,
            sellingPrice: 450000,
            stock: 5,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Xbox Series X',
            description: 'Powerful gaming console with 4K gaming, 120 FPS support, and Game Pass compatibility. Includes wireless controller.',
            category: 'Gaming',
            costPrice: 300000,
            sellingPrice: 420000,
            stock: 7,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Canon EOS R6 Mark II',
            description: 'Professional mirrorless camera with 24MP sensor, 4K video recording, and advanced autofocus. Perfect for photographers.',
            category: 'Cameras',
            costPrice: 1500000,
            sellingPrice: 2100000,
            stock: 6,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'DJI Mini 4 Pro',
            description: 'Compact drone with 4K video, obstacle avoidance, and 34-minute flight time. Perfect for aerial photography and videography.',
            category: 'Cameras',
            costPrice: 450000,
            sellingPrice: 650000,
            stock: 9,
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'OnePlus 12',
            description: 'Flagship smartphone with Snapdragon 8 Gen 3, 100W fast charging, and 50MP triple camera system. Great value for money.',
            category: 'Smartphones',
            costPrice: 450000,
            sellingPrice: 650000,
            stock: 0,
            createdAt: new Date().toISOString(),
          },
        ];
        const updatedStore = {
          ...data,
          products: dummyProducts,
        };
        setStorageData(`store_${storeId}`, updatedStore);
        setStore(updatedStore);
      } else {
        setStore(data);
      }
    }
  }, [storeId]);

  if (!mounted || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Smartphone className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold">Loading Store...</h1>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(store.products.map(p => p.category)))];

  const filteredProducts = store.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-primary">{store.storeName}</h1>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search gadgets..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href={`/store/${storeId}/cart`}>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
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
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="group overflow-hidden border-primary/10 hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-secondary/50 flex items-center justify-center relative">
                <Smartphone className="h-20 w-20 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
                    OUT OF STOCK
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-primary/10 text-primary border-none">{product.category}</Badge>
              </div>
              <CardHeader className="p-4 pb-2">
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-2xl font-black text-primary mt-1">₦{product.sellingPrice.toLocaleString()}</p>
              </CardHeader>
              <CardContent className="px-4 py-0">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {product.description || 'No description available.'}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-4 space-y-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                  disabled={product.stock === 0}
                  onClick={() => {
                    addToCart(product, 1);
                    toast({
                      title: "Added to Cart!",
                      description: `${product.name} has been added to your cart.`,
                    });
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  <Link href={`/store/${storeId}/product/${product.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-muted-foreground">No gadgets found in this category.</h2>
          </div>
        )}
      </main>
      
      <footer className="bg-secondary/20 py-12 mt-20 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">Powered by StoreStack</p>
        </div>
      </footer>
    </div>
  );
}