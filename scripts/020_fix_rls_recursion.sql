-- Fix RLS policy infinite recursion issue
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user's email ends with @layoverhq.com (admin domain)
  -- or if they are the specific admin user
  RETURN (
    auth.jwt() ->> 'email' LIKE '%@layoverhq.com' OR
    auth.jwt() ->> 'email' = 'admin@layoverhq.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple, non-recursive RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin users can view all profiles" ON profiles
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Admin users can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admin users can update all profiles" ON profiles
  FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admin users can delete profiles" ON profiles
  FOR DELETE USING (is_admin_user());

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
