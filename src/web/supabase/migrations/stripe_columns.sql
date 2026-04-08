ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
