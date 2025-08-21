-- Temporarily disable RLS on profiles table to allow admin access
-- This is a simpler approach that avoids recursion issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Drop the function that was causing recursion
DROP FUNCTION IF EXISTS is_admin_user();

-- Disable RLS temporarily to allow admin access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
-- Allow authenticated users to read all profiles (admin dashboard needs this)
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role full access" ON profiles
    FOR ALL USING (auth.role() = 'service_role');
