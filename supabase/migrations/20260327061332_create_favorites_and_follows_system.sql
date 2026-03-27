/*
  # Create Favorites and Follows System

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `listing_id` (uuid, references listings)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, listing_id)

    - `user_follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid) - the user who follows
      - `following_id` (uuid) - the user being followed
      - `created_at` (timestamp)
      - Unique constraint on (follower_id, following_id)

  2. Security
    - Enable RLS on both tables
    - favorites: users can read/write their own favorites
    - user_follows: users can manage their own follows, and read counts
*/

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
