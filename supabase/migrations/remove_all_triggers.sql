-- Remove All Trigger Functions
-- This migration removes all database triggers and functions
-- Application code will handle all logic directly

-- Drop all subscription-related triggers and functions
DROP TRIGGER IF EXISTS trigger_create_subscription_for_store ON stores;
DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON stores;
DROP TRIGGER IF EXISTS trigger_set_trial_end_date ON subscriptions;
DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
DROP FUNCTION IF EXISTS create_subscription_for_store() CASCADE;
DROP FUNCTION IF EXISTS create_trial_subscription() CASCADE;
DROP FUNCTION IF EXISTS set_trial_end_date() CASCADE;

-- Drop all updated_at triggers
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop referral-related triggers
DROP TRIGGER IF EXISTS trigger_create_referral_code ON auth.users;
DROP FUNCTION IF EXISTS create_referral_code_for_user() CASCADE;
-- Note: generate_referral_code() is kept as it may be used by application code

-- Note: generate_store_id() function is kept as it's used by application code, not triggers
-- All updated_at timestamps are now handled explicitly in application code
-- Subscription creation is handled directly in src/app/auth/actions.ts

