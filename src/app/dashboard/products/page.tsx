"use client";

import { useState, useRef } from 'react';
import { useStoreDataSupabase } from '@/hooks/use-store-data-supabase';
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
  Share2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ProductVariant } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';

export default function ProductsPage() {
  const { store, products, loading, addProduct, deleteProduct, createStore } = useStoreDataSupabase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [storeName, setStoreName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    baseStock: 0,
    imageUrls: [] as string[],
    variants: [] as ProductVariant[],
  });

  const [newVariant, setNewVariant] = useState({
    colorName: '',
    colorHex: '#000000',
    stock: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: "Please upload only image files.",
        variant: "destructive"
      });
      return;
    }

    // Check total images (existing + new)
    const totalImages = formData.imageUrls.length + files.length;
    if (totalImages > 5) {
      toast({
        title: "Too many images",
        description: `You can only upload up to 5 images. You currently have ${formData.imageUrls.length} and are trying to add ${files.length}.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newUrls = data.urls || (data.url ? [data.url] : []);
      
      setFormData(prev => ({ 
        ...prev, 
        imageUrls: [...prev.imageUrls, ...newUrls].slice(0, 5) 
      }));
      
      toast({
        title: "Images uploaded",
        description: `${newUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleAddVariant = () => {
    if (!newVariant.colorName || newVariant.stock <= 0) {
      toast({
        title: "Invalid variant",
        description: "Please provide color name and stock quantity.",
        variant: "destructive"
      });
      return;
    }

    const variant: ProductVariant = {
      id: `temp-${Date.now()}`,
      productId: '',
      colorName: newVariant.colorName,
      colorHex: newVariant.colorHex,
      stock: Number(newVariant.stock),
      createdAt: new Date().toISOString(),
    };

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, variant],
    }));

    setNewVariant({ colorName: '', colorHex: '#000000', stock: 0 });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.costPrice || !formData.sellingPrice) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingProduct(true);
    try {
      const success = await addProduct({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        baseStock: Number(formData.baseStock),
        imageUrls: formData.imageUrls,
        variants: formData.variants,
      });

      if (success) {
        setIsAdding(false);
        setFormData({ 
          name: '', 
          category: '', 
          description: '', 
          costPrice: 0, 
          sellingPrice: 0, 
          baseStock: 0,
          imageUrls: [],
          variants: [],
        });
        toast({ 
          title: "Product Added", 
          description: "Your new product is now in inventory." 
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add product. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const success = await deleteProduct(productId);
    if (success) {
      toast({ 
        title: "Product Deleted", 
        description: "Product has been removed from inventory." 
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalStock = (product: typeof products[0]) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product.baseStock;
  };

  const handleCreateStore = async () => {
    if (!storeName.trim() || !user?.email) {
      toast({
        title: "Missing information",
        description: "Please enter a store name.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingStore(true);
    const success = await createStore(storeName, user.email);
    setIsCreatingStore(false);

    if (success) {
      toast({
        title: "Store created!",
        description: "Your store has been created successfully.",
      });
      setStoreName('');
    } else {
      toast({
        title: "Error",
        description: "Failed to create store. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Package className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show store creation UI if no store exists
  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Your Store</CardTitle>
            <CardDescription className="text-center">
              You need to create a store before you can add products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                placeholder="e.g. My Gadget Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingStore) {
                    handleCreateStore();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleCreateStore}
              disabled={isCreatingStore || !storeName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isCreatingStore ? (
                <>
                  <Package className="mr-2 h-4 w-4 animate-spin" />
                  Creating Store...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Store
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and catalog.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Enter the details of your new product below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Product Images</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.imageUrls.length}/5 images
                  </span>
                </div>
                
                {/* Display uploaded images */}
                {formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Product ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                {formData.imageUrls.length < 5 && (
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload images (up to {5 - formData.imageUrls.length} more)
                    </span>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading || formData.imageUrls.length >= 5}
                    />
                    {isUploading && (
                      <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    )}
                  </div>
                )}
                
                {formData.imageUrls.length >= 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Maximum of 5 images reached. Remove an image to add more.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input 
                    id="category" 
                    placeholder="e.g. Smartphones" 
                    required 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Description</Label>
                  {/* <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-primary border-primary/20 bg-primary/5 h-7 px-2"
                    onClick={handleGenerateAI}
                    disabled={isAIGenerating}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {isAIGenerating ? 'Generating...' : 'AI Generate'}
                  </Button> */}
                </div>
                <Textarea 
                  id="description" 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (₦) *</Label>
                  <Input 
                    id="costPrice" 
                    type="number" 
                    required 
                    value={formData.costPrice} 
                    onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (₦) *</Label>
                  <Input 
                    id="sellingPrice" 
                    type="number" 
                    required 
                    value={formData.sellingPrice} 
                    onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseStock">Base Stock</Label>
                  <Input 
                    id="baseStock" 
                    type="number" 
                    value={formData.baseStock} 
                    onChange={e => setFormData({...formData, baseStock: Number(e.target.value)})} 
                  />
                  <p className="text-xs text-muted-foreground">Stock without color variants</p>
                </div>
              </div>

              {/* Color Variants */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>Color Variants</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} added
                  </span>
                </div>
                
                {/* Add Variant Form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Input
                    placeholder="Color name (e.g. Black)"
                    value={newVariant.colorName}
                    onChange={e => setNewVariant({...newVariant, colorName: e.target.value})}
                  />
                  <Input
                    type="color"
                    value={newVariant.colorHex}
                    onChange={e => setNewVariant({...newVariant, colorHex: e.target.value})}
                    className="h-10"
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={newVariant.stock || ''}
                    onChange={e => setNewVariant({...newVariant, stock: Number(e.target.value)})}
                    min="0"
                  />
                  <Button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Variants List */}
                {formData.variants.length > 0 && (
                  <div className="space-y-2">
                    {formData.variants.map((variant, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg"
                      >
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{variant.colorName}</p>
                          <p className="text-sm text-muted-foreground">Stock: {variant.stock}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAdding(false)}
                  disabled={isCreatingProduct}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary"
                  disabled={isCreatingProduct}
                >
                  {isCreatingProduct ? (
                    <>
                      <Package className="mr-2 h-4 w-4 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
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
          <div className="rounded-md border border-primary/5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {product.imageUrls && product.imageUrls.length > 0 ? (
                            <div className="flex -space-x-2">
                              {product.imageUrls.slice(0, 3).map((url, idx) => (
                                <img 
                                  key={idx}
                                  src={url} 
                                  alt={`${product.name} ${idx + 1}`}
                                  className="w-10 h-10 object-cover rounded border-2 border-background"
                                />
                              ))}
                              {product.imageUrls.length > 3 && (
                                <div className="w-10 h-10 bg-secondary rounded border-2 border-background flex items-center justify-center text-xs font-medium">
                                  +{product.imageUrls.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₦{product.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={getTotalStock(product) < 5 ? 'text-red-500 font-bold' : ''}>
                          {getTotalStock(product)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.variants && product.variants.length > 0 ? (
                          <div className="flex gap-1">
                            {product.variants.slice(0, 3).map((v, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded border"
                                style={{ backgroundColor: v.colorHex }}
                                title={`${v.colorName}: ${v.stock}`}
                              />
                            ))}
                            {product.variants.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{product.variants.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => window.open(`/store/${store?.storeId}/product/${product.id}`, '_blank')}
                            >
                              <Share2 className="mr-2 h-4 w-4" /> View Product Page
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No products found. Add your first product to get started.
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
