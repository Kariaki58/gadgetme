import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      storeId,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryCountry,
      deliveryMethod,
      items,
      totalAmount,
    } = body;

    // Get store by storeId (short ID or UUID)
    let { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('store_id', storeId)
      .single();

    if (storeError) {
      // Try by UUID
      const { data: storeById, error: storeByIdError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .single();
      
      if (storeByIdError) throw storeByIdError;
      storeData = storeById;
    }

    if (!storeData) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeData.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress || null,
        delivery_city: deliveryCity || null,
        delivery_state: deliveryState || null,
        delivery_country: deliveryCountry || null,
        delivery_method: deliveryMethod || 'delivery',
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        order_status: 'pending',
        type: 'cart',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

