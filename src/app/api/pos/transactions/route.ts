import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      storeId,
      customerName,
      items,
      expectedAmount,
      actualAmountCollected,
      extraCharge,
      profit,
      loss,
    } = body;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('pos_transactions')
      .insert({
        store_id: storeId,
        customer_name: customerName,
        expected_amount: expectedAmount,
        actual_amount_collected: actualAmountCollected,
        extra_charge: extraCharge,
        profit,
        loss,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Create transaction items
    const transactionItems = items.map((item: any) => ({
      transaction_id: transaction.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('pos_transaction_items')
      .insert(transactionItems);

    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of items) {
      if (item.variantId) {
        // Update variant stock
        const { error: variantError } = await supabase.rpc('decrement_variant_stock', {
          variant_id: item.variantId,
          quantity: item.quantity,
        });
        if (variantError) {
          // Fallback to direct update
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', item.variantId)
            .single();
          
          if (variant) {
            await supabase
              .from('product_variants')
              .update({ stock: variant.stock - item.quantity })
              .eq('id', item.variantId);
          }
        }
      } else {
        // Update base stock
        const { data: product } = await supabase
          .from('products')
          .select('base_stock')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ base_stock: product.base_stock - item.quantity })
            .eq('id', item.productId);
        }
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

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

    const { data, error } = await supabase
      .from('pos_transactions')
      .select(`
        *,
        pos_transaction_items (
          *,
          products (*),
          product_variants (*)
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

