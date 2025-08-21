-- Create admin user profile and ensure proper setup
-- This script creates the admin user profile in the profiles table

-- First, ensure the admin user exists in the profiles table
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  role,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  -- Use a fixed UUID for the admin user
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@layoverhq.com',
  'Admin',
  'User',
  'LayoverHQ Admin',
  'admin',
  'Administration',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create audit log entry for admin user setup
INSERT INTO public.audit_logs (
  id,
  user_id,
  action,
  resource_type,
  resource_id,
  timestamp,
  ip_address,
  user_agent,
  old_values,
  new_values
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'create',
  'admin_setup',
  '00000000-0000-0000-0000-000000000001'::uuid,
  now(),
  '127.0.0.1'::inet,
  'System Setup',
  '{}',
  '{"admin_user_created": true, "email": "admin@layoverhq.com"}'
) ON CONFLICT DO NOTHING;
