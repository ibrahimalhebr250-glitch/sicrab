/*
  # Create Growth System Infrastructure

  ## Overview
  This migration creates the database infrastructure for the platform growth system including follows, notifications, and enhanced tracking.

  ## New Tables

  ### `follows`
  Tracks user follows for sellers and categories
  - `id` (uuid, primary key) - Unique follow identifier
  - `follower_id` (uuid, foreign key) - User who is following
  - `following_type` (text) - Type: 'user' or 'category'
  - `following_id` (uuid) - ID of the user or category being followed
  - `created_at` (timestamptz) - When the follow was created

  ### `notifications`
  Stores in-app notifications for users
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - Recipient of the notification
  - `type` (text) - Notification type: 'message', 'new_listing', 'listing_reply'
  - `title` (text) - Notification title
  - `content` (text) - Notification content
  - `link` (text) - Link to relevant page
  - `is_read` (boolean) - Whether notification has been read
  - `related_id` (uuid) - ID of related entity (listing, message, etc)
  - `created_at` (timestamptz) - Notification creation time

  ### `listing_shares`
  Tracks social shares of listings
  - `id` (uuid, primary key) - Unique share identifier
  - `listing_id` (uuid, foreign key) - Listing that was shared
  - `platform` (text) - Share platform: 'whatsapp', 'twitter', 'copy_link'
  - `shared_at` (timestamptz) - When the share occurred

  ## Table Modifications

  ### `listings`
  - Ensure `views_count` column exists with default 0
  - Add `shares_count` for tracking total shares

  ### `profiles`
  - Add `listings_count` for caching total listings per user

  ## Security
  - Enable RLS on all new tables
  - Users can create their own follows
  - Users can view their own notifications
  - Share tracking is public for analytics

  ## Indexes
  - Index on follower_id for fast user follow queries
  - Index on following_id and type for reverse lookups
  - Index on user_id and is_read for notification queries
  - Index on listing_id for share analytics
*/

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_type text NOT NULL CHECK (following_type IN ('user', 'category')),
  following_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_type, following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'new_listing', 'listing_reply', 'promotion_expiring', 'follow')),
  title text NOT NULL,
  content text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create listing_shares table
CREATE TABLE IF NOT EXISTS listing_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'twitter', 'copy_link')),
  shared_at timestamptz DEFAULT now()
);

-- Add shares_count to listings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'shares_count'
  ) THEN
    ALTER TABLE listings ADD COLUMN shares_count integer DEFAULT 0;
  END IF;
END $$;

-- Add listings_count to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'listings_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN listings_count integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_type, following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_shares_listing ON listing_shares(listing_id);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows

CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for notifications

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for listing_shares

CREATE POLICY "Anyone can view share stats"
  ON listing_shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create shares"
  ON listing_shares FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS increment_listing_views(uuid);
DROP FUNCTION IF EXISTS increment_listing_shares(uuid);

-- Function to increment listing views
CREATE FUNCTION increment_listing_views(p_listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET views_count = views_count + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment listing shares
CREATE FUNCTION increment_listing_shares(p_listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET shares_count = shares_count + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user listings count
CREATE OR REPLACE FUNCTION update_user_listings_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET listings_count = listings_count + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET listings_count = GREATEST(listings_count - 1, 0)
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for listings count
DROP TRIGGER IF EXISTS trigger_update_listings_count ON listings;
CREATE TRIGGER trigger_update_listings_count
  AFTER INSERT OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_listings_count();

-- Function to create notification for new listing to followers
CREATE OR REPLACE FUNCTION notify_followers_new_listing()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, content, link, related_id)
  SELECT 
    f.follower_id,
    'new_listing',
    'إعلان جديد',
    'أضاف ' || p.full_name || ' إعلان جديد: ' || NEW.title,
    '/listing/' || NEW.id,
    NEW.id
  FROM follows f
  JOIN profiles p ON p.id = NEW.user_id
  WHERE f.following_type = 'user'
    AND f.following_id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, content, link, related_id)
  SELECT 
    f.follower_id,
    'new_listing',
    'إعلان جديد في قسم تتابعه',
    'إعلان جديد في ' || c.name_ar || ': ' || NEW.title,
    '/listing/' || NEW.id,
    NEW.id
  FROM follows f
  JOIN categories c ON c.id = NEW.category_id
  WHERE f.following_type = 'category'
    AND f.following_id = NEW.category_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new listing notifications
DROP TRIGGER IF EXISTS trigger_notify_new_listing ON listings;
CREATE TRIGGER trigger_notify_new_listing
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_new_listing();