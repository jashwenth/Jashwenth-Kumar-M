-- ============================================================
-- CampusPulse — Seed Data (25 Incidents)
-- Run this AFTER 001_schema.sql in Supabase SQL Editor
-- 
-- STORY: Block B has a recurring plumbing crisis.
-- The heatmap should glow red on Block B.
-- ============================================================

-- Reset sequence to start at 1000
SELECT setval('incident_seq', 999, false);

-- ============================================================
-- BLOCK B — PLUMBING CLUSTER (7 incidents — THE DEMO STORY)
-- These are deliberately similar to trigger duplicate detection
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Water Leakage Near Washroom',
  'There is significant water leaking from a pipe near the second-floor washroom in Block B. The floor is getting slippery and dangerous.',
  NULL, 'Plumbing', 'Water Leakage', 'High', 'Block B', '2nd Floor',
  'Plumbing Maintenance', 'Open', 4, true,
  'Significant water leakage near second-floor washroom causing safety hazard',
  ARRAY['water', 'leak', 'washroom', 'pipe', 'slippery'],
  NOW() - INTERVAL '13 days'
),
(
  'Water Pooling Outside Block B',
  'Water has been pooling outside the Block B entrance near the staircase. Seems like a drainage issue.',
  NULL, 'Plumbing', 'Drainage Issue', 'High', 'Block B', 'Ground Floor',
  'Plumbing Maintenance', 'In Progress', 4, true,
  'Water pooling near Block B entrance, possible drainage blockage',
  ARRAY['water', 'pool', 'drainage', 'staircase'],
  NOW() - INTERVAL '11 days'
),
(
  'Tap Leakage in Block B Restroom',
  'The tap in the ground floor restroom of Block B is leaking continuously. Water is being wasted.',
  NULL, 'Plumbing', 'Tap Leakage', 'Medium', 'Block B', 'Ground Floor',
  'Plumbing Maintenance', 'Fixed', 24, true,
  'Continuously leaking tap in ground floor restroom',
  ARRAY['tap', 'leak', 'restroom', 'water', 'waste'],
  NOW() - INTERVAL '10 days'
),
(
  'Washroom Water Issue - Block B',
  'The flush system in Block B first floor washroom is broken. Water keeps running after flush.',
  NULL, 'Plumbing', 'Flush System', 'Medium', 'Block B', '1st Floor',
  'Plumbing Maintenance', 'Fixed', 24, true,
  'Broken flush system causing continuous water flow',
  ARRAY['flush', 'washroom', 'water', 'broken'],
  NOW() - INTERVAL '8 days'
),
(
  'Pipe Leak in Block B Corridor',
  'There is a visible pipe leak in the second-floor corridor of Block B. Water is dripping from the ceiling.',
  NULL, 'Plumbing', 'Pipe Leak', 'High', 'Block B', '2nd Floor',
  'Plumbing Maintenance', 'Open', 4, true,
  'Pipe leak causing water to drip from ceiling in corridor',
  ARRAY['pipe', 'leak', 'ceiling', 'drip', 'corridor'],
  NOW() - INTERVAL '5 days'
),
(
  'Water Seepage on Block B Wall',
  'Damp patches and water seepage visible on the second-floor wall near Room 204 in Block B.',
  NULL, 'Plumbing', 'Water Seepage', 'Medium', 'Block B', '2nd Floor',
  'Plumbing Maintenance', 'Open', 24, true,
  'Water seepage and damp patches on second floor wall',
  ARRAY['seepage', 'damp', 'wall', 'water'],
  NOW() - INTERVAL '3 days'
),
(
  'Blocked Drain in Block B',
  'The drain near the Block B second-floor washroom is completely blocked. Water is overflowing.',
  NULL, 'Plumbing', 'Blocked Drain', 'Critical', 'Block B', '2nd Floor',
  'Plumbing Maintenance', 'Open', 1, true,
  'Completely blocked drain causing water overflow near washroom',
  ARRAY['drain', 'blocked', 'overflow', 'washroom', 'water'],
  NOW() - INTERVAL '1 day'
);

-- ============================================================
-- BLOCK B — ELECTRICAL (2 incidents — secondary category)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Flickering Lights in Block B Lab',
  'The tube lights in the Block B computer lab keep flickering. Very distracting during classes.',
  NULL, 'Electrical', 'Flickering Lights', 'Medium', 'Block B', '1st Floor',
  'Electrical Maintenance', 'Open', 24, true,
  'Flickering tube lights in computer lab causing distraction',
  ARRAY['lights', 'flickering', 'tube', 'lab', 'computer'],
  NOW() - INTERVAL '6 days'
),
(
  'Broken Switch in Block B Room 103',
  'The light switch in Room 103 of Block B is broken. Cannot turn on the lights.',
  NULL, 'Electrical', 'Broken Switch', 'Low', 'Block B', '1st Floor',
  'Electrical Maintenance', 'Fixed', 48, true,
  'Non-functional light switch in classroom',
  ARRAY['switch', 'broken', 'lights', 'room'],
  NOW() - INTERVAL '12 days'
);

-- ============================================================
-- BLOCK A — ELECTRICAL (3 incidents — normal baseline)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Power Outlet Not Working',
  'The power outlet near seat 5 in Block A lecture hall is not working. Cannot charge laptop.',
  NULL, 'Electrical', 'Power Outlet', 'Low', 'Block A', '2nd Floor',
  'Electrical Maintenance', 'Fixed', 48, true,
  'Non-functional power outlet in lecture hall',
  ARRAY['power', 'outlet', 'charge', 'laptop'],
  NOW() - INTERVAL '9 days'
),
(
  'Ceiling Fan Not Working',
  'The ceiling fan in Block A Room 201 is not spinning. Room gets very hot during afternoon.',
  NULL, 'Electrical', 'Fan Issue', 'Medium', 'Block A', '2nd Floor',
  'Electrical Maintenance', 'In Progress', 24, true,
  'Non-functional ceiling fan causing heat discomfort',
  ARRAY['fan', 'ceiling', 'hot', 'room'],
  NOW() - INTERVAL '4 days'
),
(
  'Broken Light in Block A Corridor',
  'One of the corridor lights on the ground floor of Block A is completely broken.',
  NULL, 'Electrical', 'Broken Light', 'Low', 'Block A', 'Ground Floor',
  'Electrical Maintenance', 'Open', 48, true,
  'Broken corridor light on ground floor',
  ARRAY['light', 'broken', 'corridor'],
  NOW() - INTERVAL '2 days'
);

-- ============================================================
-- LIBRARY — WIFI (4 incidents — second hotspot)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'WiFi Not Working in Library',
  'Cannot connect to WiFi in the library reading section. Multiple students are affected.',
  NULL, 'WiFi', 'No Connection', 'High', 'Library', '1st Floor',
  'IT Support', 'In Progress', 4, true,
  'WiFi connectivity failure in library reading section affecting multiple students',
  ARRAY['wifi', 'internet', 'library', 'connection'],
  NOW() - INTERVAL '7 days'
),
(
  'Slow WiFi in Library',
  'WiFi in the library is extremely slow. Pages take minutes to load.',
  NULL, 'WiFi', 'Slow Connection', 'Medium', 'Library', '1st Floor',
  'IT Support', 'Open', 24, true,
  'Extremely slow WiFi speeds in library',
  ARRAY['wifi', 'slow', 'internet', 'speed'],
  NOW() - INTERVAL '3 days'
),
(
  'Library WiFi Keeps Disconnecting',
  'The WiFi in library ground floor keeps disconnecting every few minutes.',
  NULL, 'WiFi', 'Intermittent Connection', 'Medium', 'Library', 'Ground Floor',
  'IT Support', 'Fixed', 24, true,
  'Intermittent WiFi disconnections in library ground floor',
  ARRAY['wifi', 'disconnect', 'intermittent', 'library'],
  NOW() - INTERVAL '10 days'
),
(
  'No WiFi Signal Near Library Entrance',
  'There is absolutely no WiFi signal near the library main entrance area.',
  NULL, 'WiFi', 'Dead Zone', 'Low', 'Library', 'Ground Floor',
  'IT Support', 'Fixed', 48, true,
  'WiFi dead zone near library main entrance',
  ARRAY['wifi', 'signal', 'dead zone', 'entrance'],
  NOW() - INTERVAL '13 days'
);

-- ============================================================
-- HOSTEL 1 — CLEANLINESS (3 incidents)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Dirty Washroom in Hostel 1',
  'The common washroom on the second floor of Hostel 1 has not been cleaned for days.',
  NULL, 'Cleanliness', 'Unclean Washroom', 'High', 'Hostel 1', '2nd Floor',
  'Housekeeping', 'Fixed', 4, true,
  'Unclean common washroom requiring immediate attention',
  ARRAY['dirty', 'washroom', 'clean', 'hygiene'],
  NOW() - INTERVAL '8 days'
),
(
  'Garbage Not Collected — Hostel 1',
  'Garbage bins on the ground floor of Hostel 1 are overflowing. Bad smell.',
  NULL, 'Cleanliness', 'Garbage Collection', 'Medium', 'Hostel 1', 'Ground Floor',
  'Housekeeping', 'Fixed', 24, true,
  'Overflowing garbage bins causing bad odor',
  ARRAY['garbage', 'bins', 'overflow', 'smell'],
  NOW() - INTERVAL '6 days'
),
(
  'Stained Floor in Hostel 1 Lobby',
  'There are old food stains on the lobby floor of Hostel 1. Looks very unhygienic.',
  NULL, 'Cleanliness', 'Floor Stains', 'Low', 'Hostel 1', 'Ground Floor',
  'Housekeeping', 'Open', 48, true,
  'Food stains on lobby floor needing cleaning',
  ARRAY['stain', 'floor', 'food', 'lobby'],
  NOW() - INTERVAL '2 days'
);

-- ============================================================
-- HOSTEL 2 — INFRASTRUCTURE (2 incidents)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Broken Chair in Hostel 2 Common Room',
  'One of the plastic chairs in the Hostel 2 common room is broken. Someone could get hurt.',
  NULL, 'Infrastructure', 'Broken Furniture', 'Low', 'Hostel 2', 'Ground Floor',
  'Civil Maintenance', 'Fixed', 48, true,
  'Broken plastic chair posing minor safety risk',
  ARRAY['chair', 'broken', 'furniture', 'common room'],
  NOW() - INTERVAL '11 days'
),
(
  'Cracked Window in Hostel 2',
  'The window in Room 305 of Hostel 2 has a large crack. Rain water comes in during storms.',
  NULL, 'Infrastructure', 'Window Damage', 'Medium', 'Hostel 2', '3rd Floor',
  'Civil Maintenance', 'Fixed', 24, true,
  'Cracked window allowing rain water ingress',
  ARRAY['window', 'crack', 'rain', 'damage'],
  NOW() - INTERVAL '9 days'
);

-- ============================================================
-- CAFETERIA — SAFETY (2 incidents)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Slippery Floor in Cafeteria',
  'The cafeteria floor near the food counter is very slippery after mopping. No wet floor sign.',
  NULL, 'Safety', 'Slip Hazard', 'High', 'Cafeteria', 'Ground Floor',
  'Campus Security', 'Fixed', 4, true,
  'Slippery floor near food counter without proper signage',
  ARRAY['slippery', 'floor', 'wet', 'hazard', 'sign'],
  NOW() - INTERVAL '7 days'
),
(
  'Exposed Wiring in Cafeteria',
  'There are exposed electrical wires hanging near the cafeteria ceiling. This is dangerous.',
  NULL, 'Safety', 'Exposed Wiring', 'Critical', 'Cafeteria', 'Ground Floor',
  'Campus Security', 'Open', 1, true,
  'Exposed electrical wires posing serious safety hazard',
  ARRAY['wire', 'exposed', 'electrical', 'danger', 'ceiling'],
  NOW() - INTERVAL '1 day'
);

-- ============================================================
-- SPORTS COMPLEX — FACILITIES (2 incidents)
-- ============================================================

INSERT INTO incidents (title, description, image_url, category, subcategory, severity, location, floor, department, status, sla_hours, ai_tagged, ai_summary, keywords, created_at)
VALUES
(
  'Broken Treadmill in Gym',
  'The treadmill in the sports complex gym is broken. Display shows error and belt does not move.',
  NULL, 'Facilities', 'Equipment Failure', 'Low', 'Sports Complex', 'Ground Floor',
  'Facilities Management', 'Open', 48, true,
  'Non-functional treadmill with display error',
  ARRAY['treadmill', 'gym', 'broken', 'equipment'],
  NOW() - INTERVAL '5 days'
),
(
  'Leaking Roof in Sports Complex',
  'The roof of the indoor sports area leaks during rain. The basketball court gets wet.',
  NULL, 'Infrastructure', 'Roof Leak', 'High', 'Sports Complex', 'Ground Floor',
  'Civil Maintenance', 'In Progress', 4, true,
  'Roof leak affecting indoor basketball court during rain',
  ARRAY['roof', 'leak', 'rain', 'basketball', 'wet'],
  NOW() - INTERVAL '4 days'
);

-- ============================================================
-- Insert activity logs for the seed incidents
-- These create the timeline that makes incidents feel real
-- ============================================================

-- Get all incident IDs and insert creation logs
INSERT INTO activity_logs (incident_id, action, details, actor, created_at)
SELECT id, 'Incident Reported', 'New incident reported by student', 'Student', created_at
FROM incidents;

-- Add AI classification logs (a few seconds after creation)
INSERT INTO activity_logs (incident_id, action, details, actor, created_at)
SELECT id, 'AI Classification Completed',
  'Category: ' || category || ' | Severity: ' || severity || ' | Department: ' || department,
  'CampusPulse AI', created_at + INTERVAL '3 seconds'
FROM incidents
WHERE ai_tagged = true;

-- Add assignment logs
INSERT INTO activity_logs (incident_id, action, details, actor, created_at)
SELECT id, 'Assigned to Department', 'Routed to ' || department, 'System', created_at + INTERVAL '5 seconds'
FROM incidents;

-- Add "In Progress" logs for incidents that are in progress or fixed
INSERT INTO activity_logs (incident_id, action, details, actor, created_at)
SELECT id, 'Status Changed to In Progress', 'Maintenance team has started work', 'Operations',
  created_at + INTERVAL '2 hours'
FROM incidents
WHERE status IN ('In Progress', 'Fixed');

-- Add "Fixed" logs for resolved incidents
INSERT INTO activity_logs (incident_id, action, details, actor, created_at)
SELECT id, 'Issue Resolved', 'Issue has been fixed and verified', 'Operations',
  created_at + INTERVAL '6 hours'
FROM incidents
WHERE status = 'Fixed';

-- Now update resolved_at for fixed incidents (trigger won't fire for seed data already inserted)
UPDATE incidents
SET resolved_at = created_at + INTERVAL '6 hours'
WHERE status = 'Fixed' AND resolved_at IS NULL;

-- ============================================================
-- Verify seed data
-- ============================================================
-- Run these queries to verify:
-- SELECT COUNT(*) FROM incidents;              -- Should be 25
-- SELECT location, COUNT(*) FROM incidents GROUP BY location ORDER BY COUNT(*) DESC;
-- SELECT category, COUNT(*) FROM incidents GROUP BY category ORDER BY COUNT(*) DESC;
-- SELECT status, COUNT(*) FROM incidents GROUP BY status;
