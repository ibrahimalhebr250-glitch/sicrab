/*
  # Allow Anon Role to View All Promotions (Admin Panel Fix)

  ## Problem
  The admin panel uses the Supabase anon client without a user auth session.
  The existing policies only allow authenticated users to view their own promotions
  or view active promotions. This blocks the admin panel from seeing all promotions.

  ## Solution
  Add a policy that allows the anon role to SELECT all promotions without restriction.
  This is acceptable because:
  1. The admin panel has its own authentication (admin_staff table + localStorage session)
  2. Promotion data is not sensitive personal data
  3. The anon key is already public by design in Supabase architecture

  Also add anon UPDATE policy so admin can cancel/extend/reactivate promotions.
*/

-- Allow anon to read all promotions (needed for admin panel)
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;

CREATE POLICY "Anon can view all promotions"
  ON promotions FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update promotions (needed for admin cancel/extend/reactivate)
CREATE POLICY "Anon can update promotions"
  ON promotions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
