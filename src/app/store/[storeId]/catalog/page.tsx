"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Smartphone, Search, ShoppingBag, Package } from 'lucide-react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { transformProduct, getTotalStock } from '@/lib/supabase/transformers';

interface Store {
  id: string;
  storeId: string;
  storeName: string;
  ownerEmail: string;
}

export default function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { getItemCount, addToCart } = useCart();
  const { toast } = useToast();

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
        });

        // Fetch products for this store
        const productsResponse = await fetch(`/api/products?storeId=${storeData.id}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        
        // Transform products
        const transformedProducts = productsData.map(transformProduct);
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error loading catalog:', error);
        toast({
          title: "Error",
          description: "Failed to load store catalog. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Smartphone className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold">Loading Store...</h1>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
          <h2 className="text-xl font-medium text-muted-foreground">Store not found</h2>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
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
          {filteredProducts.map(product => {
            const totalStock = getTotalStock(product);
            const firstImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null;
            
            return (
              <Card key={product.id} className="group overflow-hidden border-primary/10 hover:shadow-xl transition-all duration-300">
                <div className="aspect-square bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                  {firstImage ? (
                    <img 
                      src={firstImage} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <Smartphone className="h-20 w-20 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {totalStock === 0 && (
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
                    disabled={totalStock === 0}
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
            );
          })}
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
