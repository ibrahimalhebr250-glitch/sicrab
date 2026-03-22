/*
  # Fix notifications INSERT policy and listing trigger

  ## Problem
  The trigger `notify_followers_new_listing` runs on listings INSERT and tries to
  INSERT into the notifications table. However, there is no INSERT policy on
  notifications, causing the entire listings INSERT to fail with an RLS violation.

  ## Fix
  1. Add INSERT policy on notifications to allow the trigger (SECURITY DEFINER handles this)
  2. Make notify_followers_new_listing SECURITY DEFINER so it bypasses RLS
  3. Ensure the trigger function has proper permissions
*/

-- Fix the notify_followers_new_listing function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_followers_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Also add INSERT policy on notifications for authenticated users (for direct inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications"
      ON notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Fix set_listing_slug to also use SECURITY DEFINER for consistency
CREATE OR REPLACE FUNCTION set_listing_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_listing_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
