/*
  # Fix Listings RLS Policies - Clean Slate

  ## Problem
  There are multiple conflicting INSERT policies on the listings table:
  - "Authenticated users can insert listings" - requires auth.uid() = user_id
  - "Users can insert own listings" - also requires auth.uid() = user_id
  Both conflict and can silently block inserts.

  Additionally, sample data has user_id = null which means standard policies block reads for some cases.

  ## Changes
  1. Drop ALL existing listings policies
  2. Create clean, non-conflicting policies:
     - SELECT: public can view active listings OR own listings
     - INSERT: authenticated users can insert (user_id auto-handled by trigger)
     - UPDATE: authenticated users can update own listings
     - DELETE: authenticated users can delete own listings
  3. Add/update trigger to auto-set user_id from auth.uid() on insert
*/

-- Drop all existing listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view published listings" ON listings;
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON listings;
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;

-- SELECT: everyone can view active listings; owners can view their own regardless of status
CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT
  TO public
  USING (
    is_active = true
    OR auth.uid() = user_id
  );

-- INSERT: any authenticated user can insert; user_id will be set by trigger
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: owners can update their own listings
CREATE POLICY "Owners can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: owners can delete their own listings
CREATE POLICY "Owners can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger: auto-set user_id from auth.uid() on insert if not provided
CREATE OR REPLACE FUNCTION set_listing_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_listing_user_id ON listings;
CREATE TRIGGER trigger_set_listing_user_id
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION set_listing_user_id();
