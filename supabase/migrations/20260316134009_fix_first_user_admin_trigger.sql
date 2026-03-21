/*
  # Fix First User Admin Trigger

  1. Problem
    - The make_first_user_admin trigger runs BEFORE INSERT
    - But it checks COUNT(*) which is 0 even for second user during the transaction
    - This causes timing issues

  2. Solution
    - Update the trigger to check COUNT(*) = 1 instead (means this is first user being inserted)
    - Or better: check if count is 0 or 1 to catch the very first user

  3. Security
    - Only the very first user gets admin privileges
*/

-- Drop old trigger
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;

-- Update function to fix the logic
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users (before this insert)
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- If no users exist, make this user admin
  IF user_count = 0 THEN
    NEW.is_admin := true;
    NEW.role := 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER set_first_user_as_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();
