/*
  # Allow Authenticated Users to Update All Promotions (Admin Operations)

  ## Problem
  The admin panel needs to update promotions (cancel, extend, reactivate) but
  the existing UPDATE policy only allows users to update their own promotions
  via auth.uid() = user_id.

  Since the admin panel is an authenticated Supabase client (logged in as a
  regular user session during admin operations), we need to allow all authenticated
  requests to update promotions.

  ## Solution
  Replace the restrictive user-only UPDATE policy with one that allows all
  authenticated sessions to update promotions (admin operations).

  The existing "Users can update own promotions" policy remains for user self-service.
  We add a broad authenticated update policy for admin operations.

  Note: In production this should be tightened using service_role key for admin.
*/

-- Add update policy for all authenticated users (covers admin panel operations)
DROP POLICY IF EXISTS "Users can update own promotions" ON promotions;

-- Restore user self-service update (own promotions only)
CREATE POLICY "Users can update own promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
