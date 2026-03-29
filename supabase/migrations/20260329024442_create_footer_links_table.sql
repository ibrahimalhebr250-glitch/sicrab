/*
  # Create Footer Links Table

  1. New Tables
    - `footer_links`
      - `id` (uuid, primary key)
      - `section` (text) - which section: 'platform', 'support', 'policies'
      - `label` (text) - display text for the link
      - `url` (text) - href of the link
      - `sort_order` (integer) - order within section
      - `is_active` (boolean) - show/hide link
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `footer_links` table
    - Anon/authenticated can read active links
    - Only admin (via service role or anon for now) can manage links

  3. Notes
    - Seeds default links from existing platform_settings values
    - Footer component will be updated to read from this table
*/

CREATE TABLE IF NOT EXISTS footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('platform', 'support', 'policies')),
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '#',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active footer links"
  ON footer_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anon can manage footer links"
  ON footer_links FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update footer links"
  ON footer_links FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete footer links"
  ON footer_links FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage footer links"
  ON footer_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update footer links"
  ON footer_links FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete footer links"
  ON footer_links FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO footer_links (section, label, url, sort_order) VALUES
  ('platform', 'من نحن', '#', 1),
  ('platform', 'كيف نعمل', '#', 2),
  ('platform', 'الأسئلة الشائعة', '#', 3),
  ('support', 'المساعدة', '#', 1),
  ('support', 'اتصل بنا', '#', 2),
  ('support', 'بلغ عن مخالفة', '#', 3),
  ('policies', 'سياسة الاستخدام', '#', 1),
  ('policies', 'الخصوصية', '/privacy', 2),
  ('policies', 'الشروط والأحكام', '/terms', 3);
