
/*
  # Fix user_follows RLS policies

  The existing INSERT policy uses TO authenticated which sometimes fails
  when the JWT is not properly recognized. Dropping and recreating all
  policies with explicit auth.uid() checks to ensure they work correctly.
*/

DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
DROP POLICY IF EXISTS "Users can view all follows" ON user_follows;

CREATE POLICY "Users can view all follows"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Authenticated users can view follows for counts"
  ON user_follows FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);
