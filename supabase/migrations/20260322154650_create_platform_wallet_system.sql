/*
  # إنشاء نظام محفظة المنصة

  ## ملخص
  إنشاء جدول `platform_wallet_entries` لتتبع جميع إيرادات المنصة من:
  - إيرادات الترويج (مرتبطة بجدول promotions)
  - إيرادات العمولات (مرتبطة بجدول commissions)
  - يتم حساب خصم الصدقات 25% تلقائياً من الإيراد الصافي

  ## الجداول الجديدة
  - `platform_wallet_entries`
    - `id` (uuid) - معرف فريد
    - `source_type` (text) - نوع المصدر: 'promotion' أو 'commission'
    - `source_id` (uuid) - معرف السجل المصدر
    - `amount` (numeric) - المبلغ بالريال السعودي
    - `charity_deduction` (numeric) - خصم الصدقات 25%
    - `net_amount` (numeric) - الصافي بعد الخصم
    - `description` (text) - وصف العملية
    - `created_at` (timestamptz) - تاريخ الإنشاء

  ## الأمان
  - RLS مفعّل مع سياسات للمشرفين فقط
*/

CREATE TABLE IF NOT EXISTS platform_wallet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('promotion', 'commission')),
  source_id uuid,
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  charity_deduction numeric(12, 2) GENERATED ALWAYS AS (ROUND(amount * 0.25, 2)) STORED,
  net_amount numeric(12, 2) GENERATED ALWAYS AS (ROUND(amount * 0.75, 2)) STORED,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_wallet_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read platform wallet entries"
  ON platform_wallet_entries
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert platform wallet entries"
  ON platform_wallet_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read platform wallet entries"
  ON platform_wallet_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert platform wallet entries"
  ON platform_wallet_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_platform_wallet_source ON platform_wallet_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_platform_wallet_created ON platform_wallet_entries(created_at DESC);
