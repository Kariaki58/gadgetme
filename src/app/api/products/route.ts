import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // Get products with variants
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // Get variants for all products
    const productIds = products.map(p => p.id);
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds);

    if (variantsError) throw variantsError;

    // Combine products with their variants
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variants.filter(v => v.product_id === product.id),
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { storeId, name, description, category, costPrice, sellingPrice, baseStock, imageUrl, variants } = body;

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: storeId,
        name,
        description,
        category,
        cost_price: costPrice,
        selling_price: sellingPrice,
        base_stock: baseStock,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Insert variants if provided
    if (variants && variants.length > 0) {
      const variantData = variants.map((v: any) => ({
        product_id: product.id,
        color_name: v.colorName,
        color_hex: v.colorHex,
        stock: v.stock,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantData);

      if (variantsError) throw variantsError;
    }

    // Fetch product with variants
    const { data: productWithVariants, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('id', product.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(productWithVariants);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

