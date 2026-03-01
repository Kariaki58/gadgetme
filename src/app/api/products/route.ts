import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const storeIdParam = searchParams.get('storeId');

    if (!storeIdParam) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // First, get the store to find the UUID (handle both short store_id and UUID)
    let storeData;
    let { data: storeByShortId, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('store_id', storeIdParam)
      .maybeSingle();

    if (storeByShortId) {
      storeData = storeByShortId;
    } else {
      // Try as UUID
      const { data: storeByUuid, error: uuidError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeIdParam)
        .maybeSingle();
      
      if (uuidError || !storeByUuid) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        );
      }
      storeData = storeByUuid;
    }

    // Get products with variants using the store UUID
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeData.id)
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
    console.log('[API] POST /api/products - Starting request');
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[API] User check:', { hasUser: !!user, error: userError?.message });
    
    if (userError || !user) {
      console.log('[API] Unauthorized - no user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's store (use maybeSingle to handle 0 or 1 results)
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('[API] Store check:', { 
      hasStore: !!storeData, 
      storeId: storeData?.id,
      error: storeError?.message 
    });

    if (storeError) {
      console.error('[API] Store query error:', storeError);
      return NextResponse.json(
        { error: 'Error checking store', details: storeError.message },
        { status: 500 }
      );
    }

    if (!storeData) {
      console.log('[API] Store not found for user:', user.id);
      return NextResponse.json(
        { error: 'Store not found. Please create a store first by signing up.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[API] Request body:', { 
      name: body.name, 
      category: body.category,
      hasImageUrls: !!body.imageUrls,
      imageUrlsCount: Array.isArray(body.imageUrls) ? body.imageUrls.length : 0,
      variantsCount: Array.isArray(body.variants) ? body.variants.length : 0
    });
    
    const { name, description, category, costPrice, sellingPrice, baseStock, imageUrls, variants } = body;

    // Validate required fields
    if (!name || !category || costPrice === undefined || sellingPrice === undefined) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, category, costPrice, sellingPrice' },
        { status: 400 }
      );
    }

    // Ensure imageUrls is an array and limit to 5
    const imageUrlsArray = Array.isArray(imageUrls) 
      ? imageUrls.slice(0, 5) 
      : (imageUrls ? [imageUrls] : []);

    console.log('[API] Inserting product with store_id:', storeData.id);
    
    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: storeData.id,
        name,
        description,
        category,
        cost_price: costPrice,
        selling_price: sellingPrice,
        base_stock: baseStock || 0,
        image_urls: imageUrlsArray,
      })
      .select()
      .single();

    if (productError) {
      console.error('[API] Product insert error:', productError);
      throw productError;
    }
    
    console.log('[API] Product created:', product.id);

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

    console.log('[API] Product created successfully');
    return NextResponse.json(productWithVariants);
  } catch (error: any) {
    console.error('[API] Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error?.message || 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    );
  }
}

