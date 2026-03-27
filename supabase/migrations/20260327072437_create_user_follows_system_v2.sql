/*
  # Create User Follows System (v2)

  ## Overview
  Re-creates the user following system allowing users to follow seller accounts
  and receive a personalized feed of their latest listings.

  ## New Tables

  ### user_follows
  - `id` (uuid, PK) - Unique follow record ID
  - `follower_id` (uuid, FK → profiles.id) - The user who follows
  - `following_id` (uuid, FK → profiles.id) - The user being followed
  - `created_at` (timestamptz) - When the follow started

  ## Constraints
  - Unique (follower_id, following_id) - prevent duplicate follows
  - Cannot follow yourself (CHECK follower_id != following_id)

  ## Security
  - RLS enabled - only authenticated users can manage follows
  - Anyone can read follow counts for public profiles
  - Users can only insert/delete their own follow records

  ## Indexes
  - Index on follower_id for "who am I following" queries
  - Index on following_id for "who follows me" queries
*/

CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON user_follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
