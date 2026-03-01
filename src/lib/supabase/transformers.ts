import { Product, ProductVariant, StoreData, POSTransaction } from '@/types/store';

// Transform Supabase product to app Product type
export function transformProduct(supabaseProduct: any): Product {
  return {
    id: supabaseProduct.id,
    storeId: supabaseProduct.store_id,
    name: supabaseProduct.name,
    description: supabaseProduct.description || '',
    category: supabaseProduct.category,
    costPrice: parseFloat(supabaseProduct.cost_price),
    sellingPrice: parseFloat(supabaseProduct.selling_price),
    baseStock: supabaseProduct.base_stock || 0,
    imageUrl: supabaseProduct.image_url,
    variants: supabaseProduct.product_variants
      ? supabaseProduct.product_variants.map((v: any) => ({
          id: v.id,
          productId: v.product_id,
          colorName: v.color_name,
          colorHex: v.color_hex,
          stock: v.stock,
          createdAt: v.created_at,
        }))
      : [],
    createdAt: supabaseProduct.created_at,
    updatedAt: supabaseProduct.updated_at,
  };
}

// Transform app Product to Supabase format
export function transformProductForSupabase(product: Partial<Product>) {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    cost_price: product.costPrice,
    selling_price: product.sellingPrice,
    base_stock: product.baseStock,
    image_url: product.imageUrl,
  };
}

// Calculate total stock (base + variants)
export function getTotalStock(product: Product): number {
  const variantStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  return product.baseStock + variantStock;
}

// Get stock for a specific variant or base
export function getStockForVariant(product: Product, variantId?: string): number {
  if (variantId) {
    const variant = product.variants?.find(v => v.id === variantId);
    return variant?.stock || 0;
  }
  return product.baseStock;
}

