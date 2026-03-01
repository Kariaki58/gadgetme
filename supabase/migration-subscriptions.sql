-- Subscriptions Migration
-- Run this in Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('trial', 'monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    flutterwave_subscription_id TEXT UNIQUE,
    flutterwave_customer_email TEXT,
    amount_paid DECIMAL(12, 2),
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_flutterwave_id ON subscriptions(flutterwave_subscription_id);

-- Function to automatically set trial_end_date when trial starts
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan_type = 'trial' AND NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
        NEW.trial_end_date := NEW.trial_start_date + INTERVAL '14 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set trial end date
DROP TRIGGER IF EXISTS trigger_set_trial_end_date ON subscriptions;
CREATE TRIGGER trigger_set_trial_end_date
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION set_trial_end_date();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
-- Note: Service role bypasses RLS by default, so no policy needed

-- Function to automatically create trial subscription when store is created
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (store_id, user_id, plan_type, status, trial_start_date)
    VALUES (NEW.id, NEW.user_id, 'trial', 'trial', NOW())
    ON CONFLICT (store_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create trial subscription for new stores
DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON stores;
CREATE TRIGGER trigger_create_trial_subscription
    AFTER INSERT ON stores
    FOR EACH ROW
    EXECUTE FUNCTION create_trial_subscription();

-- Update existing stores to have trial subscriptions if they don't have one
INSERT INTO subscriptions (store_id, user_id, plan_type, status, trial_start_date)
SELECT 
    s.id,
    s.user_id,
    'trial',
    'trial',
    s.created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions sub WHERE sub.store_id = s.id
)
ON CONFLICT (store_id) DO NOTHING;

