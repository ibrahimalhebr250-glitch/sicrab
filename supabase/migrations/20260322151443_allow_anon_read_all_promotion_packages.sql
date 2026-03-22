/*
  # Allow Anon to Read All Promotion Packages (Admin Panel)

  ## Problem
  The admin panel (which uses anon role) cannot read promotion_packages table
  because there is no SELECT policy for the anon role.
  The existing policy only allows authenticated users to see active packages.

  ## Solution
  Add SELECT policy for anon role to read ALL packages (including inactive ones)
  so the admin panel can manage them.
*/

CREATE POLICY "Anon can view all promotion packages"
  ON promotion_packages FOR SELECT
  TO anon
  USING (true);
