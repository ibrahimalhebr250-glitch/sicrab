/*
  # Fix Reports Admin Access

  ## Problem
  The reports table only has a policy for users to view their own reports.
  Admins and staff cannot see any reports in the admin panel.

  ## Changes
  1. Add SELECT policy for admins and staff to view all reports
  2. Add UPDATE policy for admins and staff to update report status
*/

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role IN ('admin', 'staff', 'moderator'))
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role IN ('admin', 'staff', 'moderator'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role IN ('admin', 'staff', 'moderator'))
    )
  );
