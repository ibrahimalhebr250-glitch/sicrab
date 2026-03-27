/*
  # Add Footer Settings to Platform Settings

  ## Summary
  Adds footer content settings to the platform_settings table so admins
  can manage all footer links and contact info from the admin panel.

  ## New Settings Keys
  ### Platform Section
  - footer_about_url: Link for "من نحن"
  - footer_how_it_works_url: Link for "كيف نعمل"
  - footer_faq_url: Link for "الأسئلة الشائعة"

  ### Support Section
  - footer_help_url: Link for "المساعدة"
  - footer_contact_url: Link for "اتصل بنا"
  - footer_report_url: Link for "بلغ عن مخالفة"

  ### Policies Section
  - footer_usage_policy_url: Link for "سياسة الاستخدام"
  - footer_privacy_url: Link for "الخصوصية"
  - footer_terms_url: Link for "الشروط"

  ### Contact Info
  - footer_email: Contact email address
  - footer_phone: Contact phone number
  - footer_whatsapp: WhatsApp number for footer contact
  - footer_copyright: Copyright text shown at bottom
*/

INSERT INTO platform_settings (setting_key, setting_value, description, updated_at)
VALUES
  ('footer_about_url', '"/about"', 'رابط صفحة من نحن في الفوتر', now()),
  ('footer_how_it_works_url', '"#"', 'رابط صفحة كيف نعمل في الفوتر', now()),
  ('footer_faq_url', '"#"', 'رابط صفحة الأسئلة الشائعة في الفوتر', now()),
  ('footer_help_url', '"#"', 'رابط صفحة المساعدة في الفوتر', now()),
  ('footer_contact_url', '"/contact"', 'رابط صفحة اتصل بنا في الفوتر', now()),
  ('footer_report_url', '"#"', 'رابط صفحة بلغ عن مخالفة في الفوتر', now()),
  ('footer_usage_policy_url', '"#"', 'رابط سياسة الاستخدام في الفوتر', now()),
  ('footer_privacy_url', '"/privacy"', 'رابط سياسة الخصوصية في الفوتر', now()),
  ('footer_terms_url', '"/terms"', 'رابط الشروط والأحكام في الفوتر', now()),
  ('footer_email', '"info@souqalmawad.com"', 'البريد الإلكتروني للتواصل في الفوتر', now()),
  ('footer_phone', '"966501234567"', 'رقم الجوال للتواصل في الفوتر', now()),
  ('footer_whatsapp', '"966501234567"', 'رقم واتساب التواصل في الفوتر', now()),
  ('footer_copyright', '"© 2024 سوق المشاتل - جميع الحقوق محفوظة"', 'نص حقوق الملكية في أسفل الفوتر', now())
ON CONFLICT (setting_key) DO NOTHING;
