/*
  # Add High Engagement Notifications System

  ## Overview
  This migration creates a trigger system to automatically notify sellers when their listings receive high engagement.

  ## Changes
  
  ### New Function
  - `notify_high_engagement()` - Checks if a listing has reached high engagement thresholds and creates a notification

  ### New Trigger
  - Fires after listing views or whatsapp clicks are updated
  - Creates notification when thresholds are crossed (50 views or 10 whatsapp clicks)

  ## Security
  - Function runs with SECURITY DEFINER to allow system-level notification creation
  - Only creates one notification per milestone to avoid spam

  ## Notes
  - Notifications are created for listing owners
  - Helps sellers know when their listings are performing well
  - Encourages quick response to interested buyers
*/

-- Create function to check and notify high engagement
CREATE OR REPLACE FUNCTION notify_high_engagement()
RETURNS trigger AS $$
DECLARE
  v_notification_exists boolean;
BEGIN
  -- Check if listing has high engagement (50+ views or 10+ whatsapp clicks)
  IF (NEW.views_count >= 50 OR NEW.whatsapp_clicks >= 10) THEN
    
    -- Check if notification already exists for this listing
    SELECT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = NEW.user_id
        AND type = 'listing_reply'
        AND related_id = NEW.id
        AND content LIKE '%اهتمام كبير%'
    ) INTO v_notification_exists;
    
    -- Only create notification if it doesn't exist
    IF NOT v_notification_exists THEN
      INSERT INTO notifications (user_id, type, title, content, link, related_id)
      VALUES (
        NEW.user_id,
        'listing_reply',
        'إعلانك يحصل على اهتمام كبير!',
        'إعلانك "' || NEW.title || '" يحظى بتفاعل ممتاز (' || NEW.views_count || ' مشاهدة، ' || NEW.whatsapp_clicks || ' طلب تواصل). تواصل بسرعة مع المهتمين!',
        '/listing/' || NEW.id,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for high engagement notifications
DROP TRIGGER IF EXISTS trigger_notify_high_engagement ON listings;
CREATE TRIGGER trigger_notify_high_engagement
  AFTER UPDATE OF views_count, whatsapp_clicks ON listings
  FOR EACH ROW
  WHEN (NEW.views_count >= 50 OR NEW.whatsapp_clicks >= 10)
  EXECUTE FUNCTION notify_high_engagement();
