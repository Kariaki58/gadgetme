"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Smartphone, Search, Filter, ShoppingBag } from 'lucide-react';
import { getStorageData } from '@/lib/storage-utils';
import { StoreData } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [store, setStore] = useState<StoreData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const data = getStorageData<StoreData>(`store_${storeId}`);
    if (data) setStore(data);
  }, [storeId]);

  if (!store) {
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
              <CardFooter className="p-4 pt-4">
                <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                  disabled={product.stock === 0}
                >
                  <Link href={`/store/${storeId}/product/${product.id}`}>
                    View & Buy
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