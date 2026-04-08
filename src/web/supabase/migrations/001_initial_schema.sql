-- ============================================================
-- Marathon Pilates Platform — Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('client', 'instructor', 'admin');
CREATE TYPE location_type AS ENUM ('charlotte_park', 'green_hills');
CREATE TYPE session_type AS ENUM ('group_reformer', 'private_solo', 'private_duet', 'private_trio', 'sauna', 'cold_plunge', 'contrast_therapy', 'neveskin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled', 'no_show', 'completed');
CREATE TYPE membership_type AS ENUM ('founding', 'unlimited', 'eight_class', 'four_class', 'drop_in');
CREATE TYPE credit_type AS ENUM ('group', 'private', 'amenity');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE instructor_experience AS ENUM ('under_one_year', 'one_plus_year', 'master_trainer');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- Intake / health screening
  intake_completed_at TIMESTAMPTZ,
  health_conditions TEXT[], -- e.g. ['osteoporosis', 'prenatal', 'back_pain']
  polestar_traffic_light TEXT DEFAULT 'green' CHECK (polestar_traffic_light IN ('green', 'yellow', 'red')),
  -- Preferences
  preferred_location location_type,
  -- Milestones
  total_classes_completed INTEGER DEFAULT 0,
  first_class_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSTRUCTOR PROFILES (extra data for instructors)
-- ============================================================

CREATE TABLE instructor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  certifications TEXT[],
  experience_level instructor_experience NOT NULL DEFAULT 'under_one_year',
  locations location_type[] DEFAULT '{}',
  can_teach_private BOOLEAN DEFAULT TRUE,
  can_teach_group BOOLEAN DEFAULT TRUE,
  -- Payroll
  private_hourly_rate NUMERIC(8,2), -- null = individually negotiated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug location_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nashville',
  state TEXT NOT NULL DEFAULT 'TN',
  zip TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO locations (slug, name, address, zip) VALUES
  ('charlotte_park', 'Marathon Pilates — Charlotte Park', '4701 Charlotte Ave', '37209'),
  ('green_hills', 'Marathon Pilates — Green Hills', '2222 Bandywood Dr', '37215');

-- ============================================================
-- SESSION TEMPLATES (class types that repeat)
-- ============================================================

CREATE TABLE session_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_type session_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  location_id UUID REFERENCES locations(id),
  drop_in_price NUMERIC(8,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEDULED SESSIONS (actual class instances)
-- ============================================================

CREATE TABLE scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES session_templates(id),
  session_type session_type NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  instructor_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  waitlist_enabled BOOLEAN DEFAULT TRUE,
  drop_in_price NUMERIC(8,2),
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancel_reason TEXT,
  -- Payroll tier (calculated at class completion)
  instructor_pay_tier INTEGER, -- 1=low(0-4), 2=mid(5-7), 3=full(8)
  instructor_pay_amount NUMERIC(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_sessions_starts_at ON scheduled_sessions(starts_at);
CREATE INDEX idx_scheduled_sessions_location ON scheduled_sessions(location_id);
CREATE INDEX idx_scheduled_sessions_instructor ON scheduled_sessions(instructor_id);

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  session_id UUID NOT NULL REFERENCES scheduled_sessions(id),
  status booking_status NOT NULL DEFAULT 'confirmed',
  waitlist_position INTEGER, -- null if not waitlisted
  credit_used UUID, -- references credits.id
  amount_paid NUMERIC(8,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  notes TEXT, -- instructor notes post-session
  attended BOOLEAN,
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  late_cancel BOOLEAN DEFAULT FALSE, -- cancelled within 12hr window
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, session_id)
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================================
-- MEMBERSHIPS
-- ============================================================

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  membership_type membership_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  -- Billing
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  monthly_price NUMERIC(8,2),
  -- Founding member
  is_founding_member BOOLEAN DEFAULT FALSE,
  -- Dates
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_client ON memberships(client_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- ============================================================
-- CREDITS (class credits / packs)
-- ============================================================

CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  credit_type credit_type NOT NULL,
  source TEXT NOT NULL, -- 'membership', 'pack_purchase', 'gift_card', 'manual'
  membership_id UUID REFERENCES memberships(id),
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  -- Expiry
  expires_at TIMESTAMPTZ,
  -- Billing
  amount_paid NUMERIC(8,2),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_client ON credits(client_id);

-- ============================================================
-- GIFT CARDS
-- ============================================================

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  initial_balance NUMERIC(8,2) NOT NULL,
  current_balance NUMERIC(8,2) NOT NULL,
  purchaser_id UUID REFERENCES profiles(id),
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  is_physical BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WAITLIST
-- ============================================================

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  session_id UUID NOT NULL REFERENCES scheduled_sessions(id),
  position INTEGER NOT NULL,
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  converted_to_booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, session_id)
);

-- ============================================================
-- PAYROLL PERIODS
-- ============================================================

CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  processed_at TIMESTAMPTZ,
  gusto_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES payroll_periods(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  session_id UUID REFERENCES scheduled_sessions(id),
  line_type TEXT NOT NULL CHECK (line_type IN ('group_class', 'private_session', 'front_desk', 'management')),
  -- Group class tiers
  attendee_count INTEGER,
  pay_tier INTEGER, -- 1/2/3
  -- Amounts
  amount NUMERIC(8,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'booking_confirmed', 'class_reminder', 'waitlist_promoted', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  sent_via TEXT[], -- ['email', 'push', 'sms']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- ============================================================
-- ON-DEMAND CONTENT
-- ============================================================

CREATE TABLE on_demand_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id),
  duration_minutes INTEGER NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  focus_area TEXT[],
  props_required TEXT[],
  video_url TEXT,
  thumbnail_url TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  -- BASI block metadata (for AI classes)
  basi_blocks JSONB,
  polestar_screen JSONB,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: clients see their own, instructors/admins see all
CREATE POLICY "Clients view own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins view all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);
CREATE POLICY "Clients create own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own bookings" ON bookings FOR UPDATE USING (auth.uid() = client_id);

-- Memberships: clients see their own
CREATE POLICY "Clients view own memberships" ON memberships FOR SELECT USING (auth.uid() = client_id);

-- Credits: clients see their own
CREATE POLICY "Clients view own credits" ON credits FOR SELECT USING (auth.uid() = client_id);

-- Notifications: users see their own
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Scheduled sessions: public read
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sessions" ON scheduled_sessions FOR SELECT USING (TRUE);

-- Locations: public read
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON locations FOR SELECT USING (TRUE);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_credits_updated_at BEFORE UPDATE ON credits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON scheduled_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

