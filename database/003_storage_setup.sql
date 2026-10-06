-- ============================================================
-- CampusPulse — Supabase Storage Setup
-- Run this in Supabase SQL Editor to create the photo bucket
-- ============================================================

-- Create a public bucket for incident photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload photos (no auth required for hackathon)
CREATE POLICY "Allow public uploads to incident-photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'incident-photos');

-- Allow anyone to read photos
CREATE POLICY "Allow public reads from incident-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'incident-photos');
