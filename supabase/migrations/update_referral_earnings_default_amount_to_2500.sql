-- Update referral earnings default payout amount from ₦5,000 to ₦2,500
-- This affects newly created rows where `amount` is not explicitly provided.

ALTER TABLE IF EXISTS referral_earnings
  ALTER COLUMN amount SET DEFAULT 2500.00;


