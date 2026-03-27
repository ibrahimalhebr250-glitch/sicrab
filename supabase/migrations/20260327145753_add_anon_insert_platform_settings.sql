/*
  # إضافة صلاحية INSERT للـ anon على platform_settings

  لوحة التحكم تعمل بدون Supabase Auth (تستخدم admin_staff مخصص)،
  لذلك تحتاج صلاحية INSERT للـ anon حتى يعمل upsert عند إضافة مفاتيح جديدة.
*/

CREATE POLICY "Anon can insert platform settings"
  ON platform_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);
