-- Remove Free Trial - Require Immediate Payment
-- This migration removes automatic trial subscription creation
-- Users must pay immediately to access the platform

-- Drop the trigger that auto-creates trial subscriptions
DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON stores;

-- Drop the function that creates trial subscriptions
DROP FUNCTION IF EXISTS create_trial_subscription();

-- Drop the trigger that sets trial end date
DROP TRIGGER IF EXISTS trigger_set_trial_end_date ON subscriptions;

-- Drop the function that sets trial end date
DROP FUNCTION IF EXISTS set_trial_end_date();

-- Update default status to 'expired' so users must pay immediately
ALTER TABLE subscriptions 
  ALTER COLUMN status SET DEFAULT 'expired';

-- Note: Subscription creation is now handled directly in application code (src/app/auth/actions.ts)
-- No triggers needed - the signup flow creates subscriptions explicitly

-- Update existing trial subscriptions to expired if they haven't been paid
UPDATE subscriptions
SET status = 'expired'
WHERE status = 'trial' 
  AND (trial_end_date IS NULL OR trial_end_date < NOW())
  AND amount_paid IS NULL;

