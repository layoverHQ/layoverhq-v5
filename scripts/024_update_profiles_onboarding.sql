-- Add onboarding completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_preferences JSONB DEFAULT '{}';

-- Update existing users to have completed onboarding
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE role IN ('admin', 'manager', 'agent');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_travel_preferences ON public.profiles USING GIN(travel_preferences);

-- Update RLS policies to allow users to update their own onboarding status
CREATE POLICY "profiles_update_onboarding" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);
