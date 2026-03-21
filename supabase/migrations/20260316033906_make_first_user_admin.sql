/*
  # Make First User Admin Automatically

  1. Changes
    - Create trigger function to make first user admin
    - Apply trigger on profile insert
  
  2. Security
    - Only first user becomes admin automatically
    - All subsequent users are regular users
*/

-- Function to make first user admin
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM profiles) = 0 THEN
    NEW.is_admin := true;
    NEW.role := 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before insert
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;
CREATE TRIGGER set_first_user_as_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();
