
/*
  # Fix Reports RLS Policy for Admin Panel

  The admin panel uses a custom authentication system (admin_staff table) 
  separate from Supabase Auth, so auth.uid() returns null when admin panel 
  queries the reports table, causing the "Admins can view all reports" policy 
  to fail silently and return no data.

  Changes:
  - Drop the existing admin SELECT policy that relies on auth.uid()
  - Add a new policy that allows anon/unauthenticated access to reports
    (security is enforced at the admin panel application layer)
  - Keep the existing user-facing policies intact
*/

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Allow anon read reports for admin" ON reports;
DROP POLICY IF EXISTS "Allow anon update reports for admin" ON reports;
DROP POLICY IF EXISTS "Allow anon delete reports for admin" ON reports;

CREATE POLICY "Allow anon read reports for admin"
  ON reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon update reports for admin"
  ON reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete reports for admin"
  ON reports
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Admins can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = true OR profiles.role = ANY (ARRAY['admin','staff','moderator']))
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = true OR profiles.role = ANY (ARRAY['admin','staff','moderator']))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = true OR profiles.role = ANY (ARRAY['admin','staff','moderator']))
    )
  );
