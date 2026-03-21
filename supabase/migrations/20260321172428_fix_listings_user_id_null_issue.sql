/*
  # Fix listings with null user_id issue

  ## Problem
  - 66 listings exist with user_id = null
  - RLS policies prevent any operations on these listings
  - Users cannot delete or update these listings

  ## Solution
  1. Make user_id nullable in listings table (already is)
  2. Update RLS policies to handle null user_id cases
  3. For listings with null user_id:
     - Allow public read access
     - Allow any authenticated user to claim/update them
     - Allow any authenticated user to delete them (for cleanup)

  ## Changes
  - Update SELECT policy to allow viewing listings with null user_id
  - Update UPDATE policy to allow authenticated users to update null user_id listings
  - Update DELETE policy to allow authenticated users to delete null user_id listings

  ## Security Notes
  - This is intentionally permissive for null user_id listings only
  - Once a listing gets a user_id, normal ownership RLS rules apply
  - This allows cleanup of legacy/orphaned data
*/

-- Drop existing policies for listings
DROP POLICY IF EXISTS "Anyone can view published listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

-- SELECT: Allow viewing active listings (including those with null user_id)
CREATE POLICY "Anyone can view published listings"
  ON listings
  FOR SELECT
  USING (
    is_active = true
    OR user_id = auth.uid()
    OR user_id IS NULL
  );

-- INSERT: Users can only insert listings with their own user_id
CREATE POLICY "Users can insert own listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own listings OR listings with null user_id
CREATE POLICY "Users can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- DELETE: Users can delete their own listings OR listings with null user_id
CREATE POLICY "Users can delete own listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Add helpful comment
COMMENT ON COLUMN listings.user_id IS 'User ID of listing owner. NULL allowed for legacy/orphaned listings that can be claimed/deleted by any authenticated user';
