-- ============================================================
-- CampusPulse — Migration 005: Campus Assets (QR Code System)
-- Run AFTER 004_profiles_and_auth.sql
--
-- Every AC, machine, equipment, or utensil gets a row here.
-- A QR code sticker on the physical item encodes a URL that
-- pre-fills the report form with this asset's data.
-- ============================================================

-- 1. Sequence for AST-XXXX IDs
CREATE SEQUENCE IF NOT EXISTS asset_seq START WITH 1 INCREMENT BY 1;

-- 2. Assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY DEFAULT 'AST-' || LPAD(nextval('asset_seq')::TEXT, 4, '0'),
  name TEXT NOT NULL,                          -- "Split AC Unit - Room 201"
  asset_type TEXT NOT NULL                     -- AC, Fan, Projector, Router, Printer, etc.
    CHECK (asset_type IN (
      'AC', 'Fan', 'Light', 'Projector', 'Router', 'Switch',
      'Printer', 'Computer', 'Water Purifier', 'Generator',
      'Elevator', 'Fire Extinguisher', 'CCTV', 'Intercom',
      'Washing Machine', 'Vending Machine', 'Other'
    )),
  model TEXT,                                  -- "Daikin FTKF35UV16W"
  serial_number TEXT,                          -- Manufacturer serial
  manufacturer TEXT,                           -- "Daikin", "Havells", etc.
  location TEXT NOT NULL,                      -- "Block B" (matches incident locations)
  floor TEXT,                                  -- "2nd Floor"
  room TEXT,                                   -- "Room 201", "Corridor", "Lobby"
  installation_date DATE,
  warranty_expiry DATE,
  last_serviced DATE,
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Under Repair', 'Decommissioned')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),     -- Which admin registered it
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location_type ON assets(location, asset_type);

-- 4. Auto-update updated_at
CREATE TRIGGER trigger_update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. RLS — admins manage assets, everyone can read
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read assets"
  ON assets FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert assets"
  ON assets FOR INSERT
  WITH CHECK (true);  -- Simplified for hackathon

CREATE POLICY "Admins can update assets"
  ON assets FOR UPDATE
  USING (true)
  WITH CHECK (true);  -- Simplified for hackathon

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE assets;

-- ============================================================
-- 7. Seed sample assets for Wales University demo
-- ============================================================

INSERT INTO assets (name, asset_type, model, serial_number, manufacturer, location, floor, room, installation_date, warranty_expiry, status)
VALUES
-- Block A
('Split AC Unit - Room 101', 'AC', 'Daikin FTKF35UV', 'DKN-2024-0891', 'Daikin', 'Block A', '1st Floor', 'Room 101', '2024-01-15', '2027-01-15', 'Active'),
('Ceiling Fan - Room 201', 'Fan', 'Havells ES-50', 'HVL-2023-4521', 'Havells', 'Block A', '2nd Floor', 'Room 201', '2023-06-10', '2026-06-10', 'Active'),
('LED Projector - Seminar Hall', 'Projector', 'Epson EB-X51', 'EPS-2024-1102', 'Epson', 'Block A', '1st Floor', 'Seminar Hall', '2024-03-01', '2027-03-01', 'Active'),

-- Block B (more assets here — this is the problem building)
('Split AC Unit - Room 202', 'AC', 'Blue Star IC318DBTU', 'BST-2023-7742', 'Blue Star', 'Block B', '2nd Floor', 'Room 202', '2023-08-20', '2026-08-20', 'Active'),
('Split AC Unit - Computer Lab', 'AC', 'Voltas 183V CZT', 'VLT-2024-3310', 'Voltas', 'Block B', '1st Floor', 'Computer Lab', '2024-02-10', '2027-02-10', 'Active'),
('Water Purifier - Corridor', 'Water Purifier', 'Kent Grand Plus', 'KNT-2024-5501', 'Kent', 'Block B', '2nd Floor', 'Corridor', '2024-01-05', '2025-01-05', 'Active'),
('WiFi Router - Block B', 'Router', 'Cisco Meraki MR46', 'CSC-2024-2201', 'Cisco', 'Block B', '1st Floor', 'Server Room', '2024-04-15', '2027-04-15', 'Active'),
('Fire Extinguisher - Block B GF', 'Fire Extinguisher', 'Cease Fire ABC 4kg', 'CFR-2024-0045', 'Cease Fire', 'Block B', 'Ground Floor', 'Lobby', '2024-06-01', '2025-06-01', 'Active'),

-- Library
('Central AC Unit - Reading Hall', 'AC', 'Daikin FTKL50UV', 'DKN-2023-1190', 'Daikin', 'Library', '1st Floor', 'Reading Hall', '2023-05-15', '2026-05-15', 'Active'),
('WiFi Router - Library', 'Router', 'Cisco Meraki MR46', 'CSC-2024-2205', 'Cisco', 'Library', 'Ground Floor', 'Server Closet', '2024-04-15', '2027-04-15', 'Active'),
('Self-Service Printer', 'Printer', 'HP LaserJet Pro M404dn', 'HPR-2024-8801', 'HP', 'Library', 'Ground Floor', 'Print Station', '2024-07-01', '2027-07-01', 'Active'),

-- Hostel 1
('Washing Machine - Laundry', 'Washing Machine', 'LG FHM1408BDL', 'LGW-2024-3301', 'LG', 'Hostel 1', 'Ground Floor', 'Laundry Room', '2024-03-20', '2026-03-20', 'Active'),
('Water Purifier - Common Area', 'Water Purifier', 'Aquaguard Aura', 'AGR-2024-6601', 'Eureka Forbes', 'Hostel 1', 'Ground Floor', 'Common Area', '2024-02-15', '2025-02-15', 'Active'),

-- Hostel 2
('Washing Machine - Laundry', 'Washing Machine', 'Samsung WW80T504DAN', 'SSG-2024-4401', 'Samsung', 'Hostel 2', 'Ground Floor', 'Laundry Room', '2024-04-10', '2026-04-10', 'Active'),

-- Cafeteria
('Vending Machine - Beverages', 'Vending Machine', 'HUL Smart Cafe', 'HUL-2024-1101', 'HUL', 'Cafeteria', 'Ground Floor', 'Entrance', '2024-05-01', '2026-05-01', 'Active'),

-- Sports Complex
('Split AC Unit - Gym', 'AC', 'Carrier 24K Durafresh', 'CRR-2024-5590', 'Carrier', 'Sports Complex', 'Ground Floor', 'Gym', '2024-01-20', '2027-01-20', 'Active');
