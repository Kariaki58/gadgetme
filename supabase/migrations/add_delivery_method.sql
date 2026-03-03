-- Add delivery_method column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'delivery';

-- Add delivery address fields if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_state TEXT,
ADD COLUMN IF NOT EXISTS delivery_country TEXT;

-- Add comment to the column
COMMENT ON COLUMN orders.delivery_method IS 'delivery or pickup';

