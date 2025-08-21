-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Create simplified RLS policies that don't cause recursion
-- Allow users to see their own profile and let service role handle admin access
CREATE POLICY "profiles_select_policy" ON public.profiles 
  FOR SELECT USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" ON public.profiles 
  FOR UPDATE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Allow service role to delete profiles (for admin operations)
CREATE POLICY "profiles_delete_policy" ON public.profiles 
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Keep the insert policy as is (it's not problematic)
CREATE POLICY "profiles_insert_policy" ON public.profiles 
  FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );
