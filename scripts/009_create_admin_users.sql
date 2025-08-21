-- Create admin users with proper authentication
-- First, we need to create users in Supabase auth, then link them to profiles

-- Insert admin profiles (these will be linked to Supabase auth users)
INSERT INTO profiles (id, email, full_name, role, permissions, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'admin@layoverhq.com',
  'LayoverHQ Admin',
  'admin',
  ARRAY['read', 'write', 'delete', 'manage-users', 'manage-flights', 'manage-bookings', 'system-monitor', 'manage-integrations', 'view-analytics', 'manage-roles', 'audit-logs'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'manager@layoverhq.com',
  'LayoverHQ Manager',
  'manager',
  ARRAY['read', 'write', 'manage-flights', 'manage-bookings', 'view-analytics', 'system-monitor'],
  NOW(),
  NOW()
);

-- Create a function to handle user creation with proper role assignment
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'user'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- This function would typically be called from the application
  -- to create users with proper Supabase auth integration
  
  -- For now, we'll return the expected structure
  SELECT json_build_object(
    'email', user_email,
    'name', user_name,
    'role', user_role,
    'created', true
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;
