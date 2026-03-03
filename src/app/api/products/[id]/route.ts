import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's store
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, category, costPrice, sellingPrice, baseStock, imageUrls, variants } = body;

    // Verify product belongs to user's store
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct || existingProduct.store_id !== storeData.id) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Ensure imageUrls is an array and limit to 5
    const imageUrlsArray = Array.isArray(imageUrls) 
      ? imageUrls.slice(0, 5) 
      : (imageUrls ? [imageUrls] : []);

    // Update product (explicitly set updated_at - no triggers)
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        name,
        description,
        category,
        cost_price: costPrice,
        selling_price: sellingPrice,
        base_stock: baseStock,
        image_urls: imageUrlsArray,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) throw productError;

    // Delete existing variants
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    // Insert new variants if provided
    if (variants && variants.length > 0) {
      const variantData = variants.map((v: any) => ({
        product_id: id,
        color_name: v.colorName,
        color_hex: v.colorHex,
        stock: v.stock,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantData);

      if (variantsError) throw variantsError;
    }

    // Fetch updated product with variants
    const { data: productWithVariants, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(productWithVariants);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's store
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Verify product belongs to user's store
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct || existingProduct.store_id !== storeData.id) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete product (variants will be deleted via CASCADE)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

