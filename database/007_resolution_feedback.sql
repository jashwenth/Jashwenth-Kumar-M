-- ============================================================
-- CampusPulse — Migration 007: Resolution Feedback
-- Run AFTER 006
--
-- After an issue is fixed and the student is notified,
-- they can rate the resolution (1-5 stars + comment).
-- This closes the accountability loop.
-- ============================================================

-- 1. Resolution feedback table
CREATE TABLE IF NOT EXISTS resolution_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_issue_actually_fixed BOOLEAN NOT NULL DEFAULT true,   -- Student confirms fix
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_feedback_per_incident UNIQUE (incident_id)  -- Only one rating per incident
);

CREATE INDEX IF NOT EXISTS idx_feedback_incident_id ON resolution_feedback(incident_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reporter_id ON resolution_feedback(reporter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON resolution_feedback(rating);

-- 2. RLS
ALTER TABLE resolution_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to resolution_feedback"
  ON resolution_feedback FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE resolution_feedback;

-- 4. View for average feedback stats per department
-- Useful for dashboard analytics
CREATE OR REPLACE VIEW department_feedback_stats AS
SELECT
  i.department,
  COUNT(rf.id) AS total_feedback,
  ROUND(AVG(rf.rating)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN rf.rating >= 4 THEN 1 END) AS satisfied_count,
  COUNT(CASE WHEN rf.rating <= 2 THEN 1 END) AS unsatisfied_count,
  COUNT(CASE WHEN rf.is_issue_actually_fixed = false THEN 1 END) AS not_actually_fixed
FROM resolution_feedback rf
JOIN incidents i ON rf.incident_id = i.id
GROUP BY i.department;

-- 5. View for location-based feedback quality
CREATE OR REPLACE VIEW location_feedback_stats AS
SELECT
  i.location,
  COUNT(rf.id) AS total_feedback,
  ROUND(AVG(rf.rating)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN rf.is_issue_actually_fixed = false THEN 1 END) AS reopened_count
FROM resolution_feedback rf
JOIN incidents i ON rf.incident_id = i.id
GROUP BY i.location;
