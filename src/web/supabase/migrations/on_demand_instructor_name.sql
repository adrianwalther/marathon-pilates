-- Add instructor_name to on_demand_classes for instructors not yet on the platform
ALTER TABLE on_demand_classes ADD COLUMN IF NOT EXISTS instructor_name TEXT;

-- Create storage bucket for on-demand videos (run once)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('on-demand-videos', 'on-demand-videos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Allow public read access to on-demand-videos bucket
-- CREATE POLICY "Public read on-demand videos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'on-demand-videos');
