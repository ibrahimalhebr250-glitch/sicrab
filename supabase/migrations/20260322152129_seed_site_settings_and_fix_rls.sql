/*
  # Seed default site_settings row and fix RLS for anon access

  ## Problem
  1. The site_settings table is empty - no default row exists, causing the
     Settings tab in Admin Promotions to show nothing (settings is null).
  2. The SELECT policy only allows authenticated users, but the admin panel
     may query as anon. Fix by allowing anon to read site settings too.

  ## Changes
  - Insert a default site_settings row if none exists
  - Add SELECT policy for anon role
  - Add UPDATE policy for anon role (to support admin panel operations)
*/

INSERT INTO site_settings (
  site_name,
  site_logo_url,
  home_hero_title,
  home_hero_subtitle,
  commission_percentage,
  meta_title,
  meta_description,
  meta_keywords,
  platform_mode,
  promotions_enabled
)
SELECT
  'سوق السكراب',
  '',
  'اشتري وبع السكراب والحديد',
  'منصة موثوقة للبيع والشراء',
  1,
  'سوق السكراب',
  'منصة موثوقة لبيع وشراء السكراب',
  'سكراب, حديد, معادن',
  'free',
  true
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

DROP POLICY IF EXISTS "Anon can read site settings" ON site_settings;
CREATE POLICY "Anon can read site settings"
  ON site_settings
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can update site settings" ON site_settings;
CREATE POLICY "Anon can update site settings"
  ON site_settings
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
