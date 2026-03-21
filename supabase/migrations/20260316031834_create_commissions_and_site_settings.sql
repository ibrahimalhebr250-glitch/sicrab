/*
  # Create Commissions and Site Settings Tables

  1. New Tables
    - `commissions`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `seller_id` (uuid, references profiles)
      - `buyer_id` (uuid, references profiles)
      - `deal_amount` (numeric) - قيمة الصفقة
      - `commission_amount` (numeric) - قيمة العمولة
      - `commission_percentage` (numeric) - نسبة العمولة
      - `status` (text) - pending, paid, cancelled
      - `created_at` (timestamptz)

    - `site_settings`
      - `id` (uuid, primary key)
      - `site_name` (text) - اسم المنصة
      - `site_logo_url` (text) - رابط الشعار
      - `home_hero_title` (text) - العنوان الرئيسي
      - `home_hero_subtitle` (text) - العنوان الفرعي
      - `commission_percentage` (numeric) - نسبة العمولة الافتراضية
      - `meta_title` (text) - عنوان SEO
      - `meta_description` (text) - وصف SEO
      - `meta_keywords` (text) - كلمات مفتاحية
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin-only access policies using profiles.is_admin check
*/

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  commission_percentage numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'سوق السكراب',
  site_logo_url text DEFAULT '',
  home_hero_title text NOT NULL DEFAULT 'اشتري وبع السكراب والحديد',
  home_hero_subtitle text NOT NULL DEFAULT 'منصة موثوقة للبيع والشراء',
  commission_percentage numeric NOT NULL DEFAULT 1,
  meta_title text DEFAULT 'سوق السكراب',
  meta_description text DEFAULT 'منصة موثوقة لبيع وشراء السكراب',
  meta_keywords text DEFAULT 'سكراب, حديد, معادن',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commissions_listing ON commissions(listing_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller ON commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_buyer ON commissions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
