/*
  # Add footer label settings

  Adds customizable label text settings for footer links so admins can
  change the display text of each footer link without technical knowledge.

  1. New Settings Keys
    - footer_about_label, footer_how_it_works_label, footer_faq_label
    - footer_help_label, footer_contact_label, footer_report_label
    - footer_usage_policy_label, footer_privacy_label, footer_terms_label
*/

INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES
  ('footer_about_label', '"من نحن"', 'نص رابط من نحن في الفوتر'),
  ('footer_how_it_works_label', '"كيف نعمل"', 'نص رابط كيف نعمل في الفوتر'),
  ('footer_faq_label', '"الأسئلة الشائعة"', 'نص رابط الأسئلة الشائعة في الفوتر'),
  ('footer_help_label', '"المساعدة"', 'نص رابط المساعدة في الفوتر'),
  ('footer_contact_label', '"اتصل بنا"', 'نص رابط اتصل بنا في الفوتر'),
  ('footer_report_label', '"بلغ عن مخالفة"', 'نص رابط بلغ عن مخالفة في الفوتر'),
  ('footer_usage_policy_label', '"سياسة الاستخدام"', 'نص رابط سياسة الاستخدام في الفوتر'),
  ('footer_privacy_label', '"الخصوصية"', 'نص رابط الخصوصية في الفوتر'),
  ('footer_terms_label', '"الشروط والأحكام"', 'نص رابط الشروط والأحكام في الفوتر')
ON CONFLICT (setting_key) DO NOTHING;
