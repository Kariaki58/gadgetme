import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, costPrice, sellingPrice, baseStock, imageUrl, variants } = body;

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        name,
        description,
        category,
        cost_price: costPrice,
        selling_price: sellingPrice,
        base_stock: baseStock,
        image_url: imageUrl,
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
    const { id } = await params;

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

