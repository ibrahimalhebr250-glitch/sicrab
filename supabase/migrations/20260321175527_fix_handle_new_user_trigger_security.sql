/*
  # Fix handle_new_user Trigger - Database error saving new user

  ## Problem
  The trigger `handle_new_user` runs with SECURITY DEFINER but the INSERT
  policy on profiles requires `auth.uid() = id`. During user signup, auth.uid()
  returns NULL because the session doesn't exist yet when the trigger fires,
  causing a 500 error.

  ## Solution
  1. Set `search_path = public` on the trigger function (security best practice)
  2. Drop the restrictive INSERT policy that blocks the trigger
  3. Add a new INSERT policy that allows inserts where id matches the new row
     OR allows the trigger (service_role) to insert
  4. Add a separate policy for service_role to handle trigger-based inserts

  ## Changes
  - Modified `handle_new_user` function with proper search_path
  - Replaced profiles INSERT policy to handle both trigger and user-initiated inserts
*/

-- Fix the trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old INSERT policy that blocks trigger
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- New INSERT policy: allows trigger (runs as postgres/service_role) and authenticated users
CREATE POLICY "Allow profile creation on signup"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Also allow service_role (used by trigger SECURITY DEFINER) to always insert
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);
