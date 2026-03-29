/*
  # Add Page Content Fields to site_settings

  ## Summary
  Adds editable content fields for static pages so admins can manage them from the dashboard.

  ## New Columns Added to site_settings
  - `about_title` - Page title for "About Us"
  - `about_subtitle` - Page subtitle for "About Us"
  - `about_intro` - Main intro paragraph for "About Us"
  - `about_vision` - Vision section text
  - `about_values` - JSON array of values
  - `about_feature_1_title` / `about_feature_1_desc` - Feature card 1
  - `about_feature_2_title` / `about_feature_2_desc` - Feature card 2
  - `about_feature_3_title` / `about_feature_3_desc` - Feature card 3
  - `footer_about_text` - Short "about us" blurb shown in footer
  - `privacy_content` - Full privacy policy text (HTML or plain)
  - `terms_content` - Full terms of service text (HTML or plain)
  - `contact_email` - Contact email shown on contact page
  - `contact_phone` - Contact phone shown on contact page
  - `contact_address` - Contact address shown on contact page
  - `contact_hours` - Working hours shown on contact page
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_title') THEN
    ALTER TABLE site_settings ADD COLUMN about_title text DEFAULT 'من نحن';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_subtitle') THEN
    ALTER TABLE site_settings ADD COLUMN about_subtitle text DEFAULT 'منصة سوق المشاتل والأشجار';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_intro') THEN
    ALTER TABLE site_settings ADD COLUMN about_intro text DEFAULT 'نحن منصة رائدة في مجال بيع وشراء الأشجار والنباتات والمشاتل في السعودية. نهدف إلى ربط أصحاب المشاتل والمشترين في سوق واحد موثوق وآمن.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_vision') THEN
    ALTER TABLE site_settings ADD COLUMN about_vision text DEFAULT 'نسعى لأن نكون المنصة الأولى والأكثر موثوقية في المملكة العربية السعودية لتجارة الأشجار والنباتات والمشاتل، مع توفير أفضل تجربة للمستخدمين.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_1_title') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_1_title text DEFAULT 'الأمان والثقة';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_1_desc') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_1_desc text DEFAULT 'نوفر بيئة آمنة للتجارة مع نظام تحقق وتقييمات موثوقة';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_2_title') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_2_title text DEFAULT 'مجتمع نشط';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_2_desc') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_2_desc text DEFAULT 'آلاف المستخدمين النشطين من أصحاب مشاتل ومحبي الزراعة في جميع أنحاء المملكة';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_3_title') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_3_title text DEFAULT 'سهولة الاستخدام';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'about_feature_3_desc') THEN
    ALTER TABLE site_settings ADD COLUMN about_feature_3_desc text DEFAULT 'واجهة بسيطة وسهلة تمكنك من إضافة إعلانك في دقائق';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'footer_about_text') THEN
    ALTER TABLE site_settings ADD COLUMN footer_about_text text DEFAULT 'منصة موثوقة لبيع وشراء الأشجار والنباتات والمشاتل في المملكة العربية السعودية.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'privacy_content') THEN
    ALTER TABLE site_settings ADD COLUMN privacy_content text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'terms_content') THEN
    ALTER TABLE site_settings ADD COLUMN terms_content text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'contact_email') THEN
    ALTER TABLE site_settings ADD COLUMN contact_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'contact_phone') THEN
    ALTER TABLE site_settings ADD COLUMN contact_phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'contact_address') THEN
    ALTER TABLE site_settings ADD COLUMN contact_address text DEFAULT 'المملكة العربية السعودية';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'contact_hours') THEN
    ALTER TABLE site_settings ADD COLUMN contact_hours text DEFAULT 'متاح من 9 صباحاً - 9 مساءً';
  END IF;
END $$;
