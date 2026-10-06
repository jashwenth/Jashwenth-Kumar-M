-- ============================================================
-- CampusPulse — Migration 006: Add Reporter & Asset Fields to Incidents
-- Run AFTER 004 and 005
--
-- Adds reporter tracking (who filed it), asset linking (what
-- equipment is affected), and an email notification log.
-- ============================================================

-- 1. Add reporter columns to incidents
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reporter_email TEXT,
  ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- 2. Add asset reference
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS asset_id TEXT REFERENCES assets(id);

-- 3. Index for reporter lookups (student viewing their own reports)
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_asset_id ON incidents(asset_id);

-- 4. Notification tracking table
-- Records every email sent so we can audit and avoid duplicates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  notification_type TEXT NOT NULL DEFAULT 'resolution'
    CHECK (notification_type IN ('resolution', 'status_update', 'escalation', 'feedback_request')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
  brevo_message_id TEXT,       -- Brevo's response ID for tracking
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_incident_id ON notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);

-- 5. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to notifications"
  ON notifications FOR ALL
  USING (true)
  WITH CHECK (true);
