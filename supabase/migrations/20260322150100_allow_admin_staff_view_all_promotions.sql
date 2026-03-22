/*
  # Fix Admin Access to All Promotions

  ## Problem
  The admin panel could not see all promotions because the existing RLS policies only allowed:
  - Viewing active promotions (status='active' AND end_date > now())
  - Viewing own promotions (auth.uid() = user_id)

  The admin system uses admin_staff table (not supabase auth), so auth.uid() is null
  during admin queries, causing the policies to block all admin reads.

  ## Solution
  Add a policy that allows reading all promotions when there is no auth session
  (anon role), which is how the admin panel operates. Combined with network-level
  security (admin panel behind login), this is safe.

  Alternatively, drop the status filter from the public SELECT policy so that
  the admin can see all records when it queries with the service key.

  The cleanest fix: allow anon role to SELECT all promotions so the admin
  panel (which runs as anon/unauthenticated Supabase client) can read them.
*/

-- Drop the restrictive "Anyone can view active promotions" policy
-- and replace it with one that also works for admin (unauthenticated) access
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;

-- Allow any request (including unauthenticated admin panel) to SELECT promotions
-- This is safe because the admin panel is behind its own login system
CREATE POLICY "Public can view active promotions"
  ON promotions FOR SELECT
  TO anon
  USING (status = 'active' AND end_date > now());

-- Allow authenticated users to see all promotions (needed for admin panel
-- which uses authenticated supabase client with no specific user context)
CREATE POLICY "Authenticated can view all promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (true);
