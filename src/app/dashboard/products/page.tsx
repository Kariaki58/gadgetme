"use client";

import { useState } from 'react';
import { useStoreData } from '@/hooks/use-store-data';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Sparkles, 
  Search, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const { store, addProduct, updateProduct, deleteProduct } = useStoreData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
  });

  const handleGenerateAI = async () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Missing info",
        description: "Please enter product name and category first.",
        variant: "destructive"
      });
      return;
    }

    setIsAIGenerating(true);
    try {
      const res = await generateProductDescription({
        productName: formData.name,
        productCategory: formData.category
      });
      setFormData(prev => ({ ...prev, description: res.description }));
      toast({
        title: "AI Generated!",
        description: "Product description has been updated.",
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Could not generate description at this time.",
        variant: "destructive"
      });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      ...formData,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      stock: Number(formData.stock),
    });
    setIsAdding(false);
    setFormData({ name: '', category: '', description: '', costPrice: 0, sellingPrice: 0, stock: 0 });
    toast({ title: "Product Added", description: "Your new gadget is now in inventory." });
  };

  const filteredProducts = store?.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground">Manage your gadgets and catalog links.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Gadget</DialogTitle>
              <DialogDescription>Enter the details of your new product below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="e.g. Smartphones" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Description</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-primary border-primary/20 bg-primary/5 h-7 px-2"
                    onClick={handleGenerateAI}
                    disabled={isAIGenerating}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {isAIGenerating ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Textarea id="description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (₦)</Label>
                  <Input id="costPrice" type="number" required value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (₦)</Label>
                  <Input id="sellingPrice" type="number" required value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Level</Label>
                  <Input id="stock" type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-primary">Create Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-primary/5">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₦{product.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 5 ? 'text-red-500 font-bold' : ''}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/store/${store?.storeId}/product/${product.id}`, '_blank')}>
                              <Share2 className="mr-2 h-4 w-4" /> View Product Page
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteProduct(product.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No products found. Add your first gadget to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}