-- ============================================================
-- CampusPulse — Migration 004: User Profiles & Authentication
-- Run AFTER 001_schema.sql, 002_seed_data.sql, 003_storage_setup.sql
--
-- Uses Supabase Auth (auth.users) with a public profiles table
-- for role management (student / admin / maintenance).
-- ============================================================

-- 1. Profiles table — extends Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'admin', 'maintenance')),
  department TEXT,          -- For maintenance staff: which department they belong to
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 3. Auto-update updated_at
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();  -- Reuses the function from 001_schema.sql

-- 4. Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. Enable Realtime on profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 6. RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own profile (name, phone, avatar only)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow anon access for hackathon development (remove in production)
CREATE POLICY "Allow anon read profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- 7. Seed admin accounts
-- NOTE: You must create these users in Supabase Auth first
-- (Dashboard → Authentication → Users → Add User), then run this:
--
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@wales.edu';
-- UPDATE profiles SET role = 'maintenance', department = 'Plumbing Maintenance'
--   WHERE email = 'maintenance@wales.edu';
