-- GadgetMe Database Schema for Supabase
-- Run this script in your Supabase SQL Editor
-- This will drop existing tables and recreate them with the new schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS pos_transaction_items CASCADE;

DROP TABLE IF EXISTS pos_transactions CASCADE;

DROP TABLE IF EXISTS order_items CASCADE;

DROP TABLE IF EXISTS orders CASCADE;

DROP TABLE IF EXISTS product_variants CASCADE;

DROP TABLE IF EXISTS products CASCADE;

DROP TABLE IF EXISTS stores CASCADE;

-- Users table (profiles extending auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    store_id UUID, -- Will be filled after store creation
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Stores table (linked to auth.users and public.users)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    store_id TEXT NOT NULL UNIQUE, -- Short store ID for public URLs (e.g., "abc123")
    store_name TEXT NOT NULL,
    owner_email TEXT NOT NULL UNIQUE,
    account_bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    account_phone TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Link users to stores via store_id foreign key (optional but good for referential integrity)
ALTER TABLE users
ADD CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL;

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    store_id UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    base_stock INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Product variants (colors) table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    color_name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (product_id, color_name)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    store_id UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    order_status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'online',
    payment_confirmed_at TIMESTAMP
    WITH
        TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id),
    variant_id UUID REFERENCES product_variants (id),
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- POS transactions table
CREATE TABLE pos_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    store_id UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    expected_amount DECIMAL(12, 2) NOT NULL,
    actual_amount_collected DECIMAL(12, 2) NOT NULL,
    extra_charge DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    loss DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- POS transaction items table
CREATE TABLE pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    transaction_id UUID NOT NULL REFERENCES pos_transactions (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id),
    variant_id UUID REFERENCES product_variants (id),
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_store_id ON products (store_id);

CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);

CREATE INDEX idx_orders_store_id ON orders (store_id);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

CREATE INDEX idx_pos_transactions_store_id ON pos_transactions (store_id);

CREATE INDEX idx_pos_transaction_items_transaction_id ON pos_transaction_items (transaction_id);

CREATE INDEX idx_stores_store_id ON stores (store_id);

CREATE INDEX idx_stores_user_id ON stores (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Users can view their own store" ON stores;

DROP POLICY IF EXISTS "Users can insert their own store" ON stores;

DROP POLICY IF EXISTS "Users can update their own store" ON stores;

DROP POLICY IF EXISTS "Users can delete their own store" ON stores;

DROP POLICY IF EXISTS "Users can view products from their store" ON products;

DROP POLICY IF EXISTS "Users can insert products to their store" ON products;

DROP POLICY IF EXISTS "Users can update products from their store" ON products;

DROP POLICY IF EXISTS "Users can delete products from their store" ON products;

DROP POLICY IF EXISTS "Users can view variants from their store products" ON product_variants;

DROP POLICY IF EXISTS "Users can insert variants to their store products" ON product_variants;

DROP POLICY IF EXISTS "Users can update variants from their store products" ON product_variants;

DROP POLICY IF EXISTS "Users can delete variants from their store products" ON product_variants;

DROP POLICY IF EXISTS "Users can view orders from their store" ON orders;

DROP POLICY IF EXISTS "Users can insert orders to their store" ON orders;

DROP POLICY IF EXISTS "Users can update orders from their store" ON orders;

DROP POLICY IF EXISTS "Users can delete orders from their store" ON orders;

DROP POLICY IF EXISTS "Users can view order items from their store orders" ON order_items;

DROP POLICY IF EXISTS "Users can insert order items to their store orders" ON order_items;

DROP POLICY IF EXISTS "Users can update order items from their store orders" ON order_items;

DROP POLICY IF EXISTS "Users can delete order items from their store orders" ON order_items;

DROP POLICY IF EXISTS "Users can view pos transactions from their store" ON pos_transactions;

DROP POLICY IF EXISTS "Users can insert pos transactions to their store" ON pos_transactions;

DROP POLICY IF EXISTS "Users can update pos transactions from their store" ON pos_transactions;

DROP POLICY IF EXISTS "Users can delete pos transactions from their store" ON pos_transactions;

DROP POLICY IF EXISTS "Users can view pos transaction items from their store" ON pos_transaction_items;

DROP POLICY IF EXISTS "Users can insert pos transaction items to their store" ON pos_transaction_items;

DROP POLICY IF EXISTS "Users can update pos transaction items from their store" ON pos_transaction_items;

DROP POLICY IF EXISTS "Users can delete pos transaction items from their store" ON pos_transaction_items;

-- RLS Policies for stores (users can only access their own store)
CREATE POLICY "Users can view their own store" ON stores FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own store" ON stores FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own store" ON stores FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own store" ON stores FOR DELETE USING (auth.uid () = user_id);

-- RLS Policies for products (users can only access products from their store)
CREATE POLICY "Users can view products from their store" ON products FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert products to their store" ON products FOR
INSERT
WITH
    CHECK (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update products from their store" ON products FOR
UPDATE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete products from their store" ON products FOR DELETE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

-- RLS Policies for product_variants
CREATE POLICY "Users can view variants from their store products" ON product_variants FOR
SELECT USING (
        product_id IN (
            SELECT p.id
            FROM products p
                INNER JOIN stores s ON p.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert variants to their store products" ON product_variants FOR
INSERT
WITH
    CHECK (
        product_id IN (
            SELECT p.id
            FROM products p
                INNER JOIN stores s ON p.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update variants from their store products" ON product_variants FOR
UPDATE USING (
    product_id IN (
        SELECT p.id
        FROM products p
            INNER JOIN stores s ON p.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete variants from their store products" ON product_variants FOR DELETE USING (
    product_id IN (
        SELECT p.id
        FROM products p
            INNER JOIN stores s ON p.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

-- RLS Policies for orders
CREATE POLICY "Users can view orders from their store" ON orders FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert orders to their store" ON orders FOR
INSERT
WITH
    CHECK (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update orders from their store" ON orders FOR
UPDATE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete orders from their store" ON orders FOR DELETE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items from their store orders" ON order_items FOR
SELECT USING (
        order_id IN (
            SELECT o.id
            FROM orders o
                INNER JOIN stores s ON o.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert order items to their store orders" ON order_items FOR
INSERT
WITH
    CHECK (
        order_id IN (
            SELECT o.id
            FROM orders o
                INNER JOIN stores s ON o.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update order items from their store orders" ON order_items FOR
UPDATE USING (
    order_id IN (
        SELECT o.id
        FROM orders o
            INNER JOIN stores s ON o.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete order items from their store orders" ON order_items FOR DELETE USING (
    order_id IN (
        SELECT o.id
        FROM orders o
            INNER JOIN stores s ON o.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

-- RLS Policies for pos_transactions
CREATE POLICY "Users can view pos transactions from their store" ON pos_transactions FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert pos transactions to their store" ON pos_transactions FOR
INSERT
WITH
    CHECK (
        store_id IN (
            SELECT id
            FROM stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update pos transactions from their store" ON pos_transactions FOR
UPDATE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete pos transactions from their store" ON pos_transactions FOR DELETE USING (
    store_id IN (
        SELECT id
        FROM stores
        WHERE
            user_id = auth.uid ()
    )
);

-- RLS Policies for pos_transaction_items
CREATE POLICY "Users can view pos transaction items from their store" ON pos_transaction_items FOR
SELECT USING (
        transaction_id IN (
            SELECT pt.id
            FROM pos_transactions pt
                INNER JOIN stores s ON pt.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert pos transaction items to their store" ON pos_transaction_items FOR
INSERT
WITH
    CHECK (
        transaction_id IN (
            SELECT pt.id
            FROM pos_transactions pt
                INNER JOIN stores s ON pt.store_id = s.id
            WHERE
                s.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update pos transaction items from their store" ON pos_transaction_items FOR
UPDATE USING (
    transaction_id IN (
        SELECT pt.id
        FROM pos_transactions pt
            INNER JOIN stores s ON pt.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete pos transaction items from their store" ON pos_transaction_items FOR DELETE USING (
    transaction_id IN (
        SELECT pt.id
        FROM pos_transactions pt
            INNER JOIN stores s ON pt.store_id = s.id
        WHERE
            s.user_id = auth.uid ()
    )
);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_store_id();

DROP FUNCTION IF EXISTS update_updated_at_column ();

-- Function to generate short store ID
CREATE FUNCTION generate_store_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();