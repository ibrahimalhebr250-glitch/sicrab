/*
  # Allow Anon Role to Delete Promotions (Admin Panel)

  ## Problem
  The admin panel needs to delete promotions but no DELETE policy exists for the anon role.
  The admin panel operates as anon (no supabase auth session).

  ## Solution
  Add DELETE policy for anon role so admin panel can delete user promotions.
*/

CREATE POLICY "Anon can delete promotions"
  ON promotions FOR DELETE
  TO anon
  USING (true);
