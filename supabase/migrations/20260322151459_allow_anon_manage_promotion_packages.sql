/*
  # Allow Anon to Update and Delete Promotion Packages (Admin Panel)

  ## Problem
  The admin panel needs to update and delete promotion_packages but no such
  policies exist for the anon role.

  ## Solution
  Add UPDATE and DELETE policies for anon role on promotion_packages.
*/

CREATE POLICY "Anon can update promotion packages"
  ON promotion_packages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete promotion packages"
  ON promotion_packages FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can insert promotion packages"
  ON promotion_packages FOR INSERT
  TO anon
  WITH CHECK (true);
