import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order and verify it belongs to user's store
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the order belongs to the user's store
    if (order.stores.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update payment status (explicitly set updated_at - no triggers)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Update product stock
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (orderItems) {
      for (const item of orderItems) {
        if (item.variant_id) {
          // Update variant stock
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', item.variant_id)
            .single();
          
          if (variant) {
            await supabase
              .from('product_variants')
              .update({ 
                stock: Math.max(0, variant.stock - item.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.variant_id);
          }
        } else {
          // Update base stock
          const { data: product } = await supabase
            .from('products')
            .select('base_stock')
            .eq('id', item.product_id)
            .single();
          
          if (product) {
            await supabase
              .from('products')
              .update({ 
                base_stock: Math.max(0, product.base_stock - item.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product_id);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

