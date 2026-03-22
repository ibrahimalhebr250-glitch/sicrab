/*
  # Add Foreign Key from promotions to profiles

  ## Problem
  The promotions table has a user_id column but no foreign key constraint
  pointing to the profiles table. This causes Supabase JS client nested selects
  like `profiles(full_name, phone)` to fail silently, returning null for profiles.

  ## Solution
  Add a foreign key constraint from promotions.user_id to profiles.id
  so that Supabase can correctly perform the relational join.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'promotions_user_id_profiles_fkey'
    AND table_name = 'promotions'
  ) THEN
    ALTER TABLE promotions
      ADD CONSTRAINT promotions_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
