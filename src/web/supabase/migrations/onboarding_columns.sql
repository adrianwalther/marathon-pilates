-- Add onboarding / intake columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('new_to_pilates', 'less_than_1yr', '1_to_3_yrs', '3_plus_yrs'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hear_about_us TEXT;
