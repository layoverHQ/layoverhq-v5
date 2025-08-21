-- Update admin user roles in profiles table
-- This fixes the issue where admin users were created with role='user' instead of 'admin'/'manager'

-- Update the admin user profile
UPDATE public.profiles 
SET 
  role = 'admin',
  first_name = 'Admin',
  last_name = 'User',
  display_name = 'Admin User',
  department = 'Administration',
  updated_at = NOW()
WHERE email = 'admin@layoverhq.com';

-- Update the manager user profile  
UPDATE public.profiles 
SET 
  role = 'manager',
  first_name = 'Manager',
  last_name = 'User', 
  display_name = 'Manager User',
  department = 'Management',
  updated_at = NOW()
WHERE email = 'manager@layoverhq.com';

-- Verify the updates
SELECT id, email, role, first_name, last_name, display_name, department 
FROM public.profiles 
WHERE email IN ('admin@layoverhq.com', 'manager@layoverhq.com');
