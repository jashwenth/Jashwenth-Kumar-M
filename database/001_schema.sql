-- ============================================================
-- CampusPulse — Database Schema
-- Run this FIRST in Supabase SQL Editor (before seed data)
-- ============================================================

-- 1. Sequence for generating CP-XXXX incident IDs
CREATE SEQUENCE IF NOT EXISTS incident_seq START WITH 1000 INCREMENT BY 1;

-- 2. Main incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY DEFAULT 'CP-' || LPAD(nextval('incident_seq')::TEXT, 4, '0'),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  subcategory TEXT,
  severity TEXT NOT NULL DEFAULT 'Medium'
    CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  location TEXT NOT NULL,
  floor TEXT,
  department TEXT NOT NULL DEFAULT 'Facilities Management',
  status TEXT NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'In Progress', 'Fixed')),
  sla_hours INTEGER NOT NULL DEFAULT 24,
  sla_deadline TIMESTAMPTZ,
  report_count INTEGER NOT NULL DEFAULT 1,
  ai_tagged BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 3. Incident relations (for duplicate / related tracking)
CREATE TABLE IF NOT EXISTS incident_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  related_incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  similarity REAL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_relation CHECK (incident_id <> related_incident_id),
  CONSTRAINT unique_relation UNIQUE (incident_id, related_incident_id)
);

-- 4. Activity log (timeline for each incident)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  actor TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(location);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_location_category ON incidents(location, category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_incident_id ON activity_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_relations_incident_id ON incident_relations(incident_id);

-- 6. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Auto-set resolved_at when status changes to 'Fixed'
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Fixed' AND (OLD.status IS NULL OR OLD.status <> 'Fixed') THEN
    NEW.resolved_at = NOW();
  END IF;
  IF NEW.status <> 'Fixed' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_resolved_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at();

-- 8. Auto-calculate sla_deadline from sla_hours on insert
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline = NEW.created_at + (NEW.sla_hours || ' hours')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sla_deadline
  BEFORE INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_deadline();

-- 9. Enable Supabase Realtime on incidents table
-- (this lets the frontend receive live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- 10. Disable Row Level Security for hackathon (no auth needed)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (using anon key)
CREATE POLICY "Allow all access to incidents"
  ON incidents FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to incident_relations"
  ON incident_relations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to activity_logs"
  ON activity_logs FOR ALL
  USING (true)
  WITH CHECK (true);
