/*
  # Create Admin System

  ## Overview
  This migration creates a comprehensive admin system for platform management.

  ## Changes
  
  ### 1. Admin Roles
  - Add is_admin column to profiles table
  - Add role column (admin, moderator, user)
  
  ### 2. Platform Settings Table
  - Store platform configuration
  - Commission rates
  - Terms and policies
  - SEO settings
  
  ### 3. Platform Statistics View
  - Real-time platform metrics
  - User growth
  - Listing stats
  - Engagement metrics

  ## Security
  - RLS policies for admin-only access
  - Audit logging for admin actions
  - Secure settings management
*/

-- Add admin roles to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspended_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended_reason text;
  END IF;
END $$;

-- Create platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES
  ('platform_name', '"سوق السكراب"', 'Platform name'),
  ('commission_rate', '5', 'Commission percentage'),
  ('terms_of_service', '""', 'Terms of service text'),
  ('privacy_policy', '""', 'Privacy policy text'),
  ('seo_title', '"سوق السكراب - بيع وشراء السكراب والمعدات الصناعية"', 'SEO title'),
  ('seo_description', '"منصة متخصصة لبيع وشراء السكراب والمعدات الصناعية والطبليات في السعودية"', 'SEO description'),
  ('seo_keywords', '"سكراب، معدات صناعية، طبليات، مواد بناء، حاويات"', 'SEO keywords')
ON CONFLICT (setting_key) DO NOTHING;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can insert audit log"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for platform statistics
CREATE OR REPLACE VIEW platform_statistics AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE is_suspended = false) as total_users,
  (SELECT COUNT(*) FROM listings WHERE is_active = true) as total_listings,
  (SELECT COALESCE(SUM(views_count), 0) FROM listings) as total_views,
  (SELECT COALESCE(SUM(whatsapp_clicks), 0) FROM listings) as total_whatsapp_clicks,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM promotions WHERE status = 'active') as active_promotions,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '7 days') as new_listings_week;

-- Grant access to platform statistics view
GRANT SELECT ON platform_statistics TO authenticated;

-- Create view for category statistics
CREATE OR REPLACE VIEW category_statistics AS
SELECT
  c.id,
  c.name_ar,
  c.slug,
  COUNT(l.id) as listings_count,
  COALESCE(SUM(l.views_count), 0) as total_views,
  COALESCE(SUM(l.whatsapp_clicks), 0) as total_whatsapp_clicks
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id AND l.is_active = true
GROUP BY c.id, c.name_ar, c.slug
ORDER BY listings_count DESC;

-- Grant access to category statistics view
GRANT SELECT ON category_statistics TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
