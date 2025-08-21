-- Complete fix for RLS recursion and admin authentication
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "admin_all_access" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_delete_profiles" ON profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS is_admin_user();

-- Disable RLS temporarily to fix the recursion issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create admin profile if it doesn't exist
INSERT INTO profiles (id, email, full_name, role, status, permissions, created_at, updated_at)
VALUES (
  'be4c5c14-b88a-454e-a698-1317e92ee624',
  'admin@layoverhq.com',
  'LayoverHQ Admin',
  'admin',
  'active',
  ARRAY['read', 'write', 'delete', 'manage-users', 'manage-roles', 'manage-integrations', 'view-analytics', 'manage-settings', 'manage-backend-services', 'manage-notifications'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Re-enable RLS with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "allow_authenticated_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_insert" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_update" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_delete" ON profiles
  FOR DELETE USING (auth.role() = 'authenticated');
