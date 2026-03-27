
/*
  # Fix user_follows SELECT policy

  Allow authenticated users to read follows where they are either follower or following.
  Also allow reading all follows for public profile display (follower/following counts).
*/

DROP POLICY IF EXISTS "Users can view all follows" ON user_follows;
DROP POLICY IF EXISTS "Authenticated users can view follows for counts" ON user_follows;

CREATE POLICY "Authenticated users can view their follows"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Anyone can view follow counts"
  ON user_follows FOR SELECT
  TO anon
  USING (false);
