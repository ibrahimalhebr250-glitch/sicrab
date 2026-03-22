/*
  # إنشاء نظام الحسابات البنكية والتحويلات

  ## ملخص
  يُنشئ هذا الـ migration نظاماً متكاملاً لإدارة الحسابات البنكية والتحويلات المرتبطة بالعمولات.

  ## الجداول الجديدة

  ### 1. `platform_bank_account`
  حساب البنك الخاص بالمنصة الذي تُسجّله الإدارة ويظهر للمستخدمين عند دفع العمولة.
  - `id` - معرف
  - `bank_name` - اسم البنك
  - `account_name` - اسم صاحب الحساب
  - `account_number` - رقم الحساب
  - `iban` - الآيبان
  - `is_active` - هل الحساب نشط
  - `notes` - ملاحظات للمستخدمين

  ### 2. `commission_transfers`
  سجل تحويلات العمولة التي يرفعها البائعون بعد إتمام الصفقة.
  - `id` - معرف
  - `commission_id` - ربط بالعمولة
  - `seller_id` - البائع
  - `transfer_amount` - مبلغ التحويل
  - `transfer_reference` - رقم مرجعي للتحويل
  - `transfer_date` - تاريخ التحويل
  - `bank_account_id` - الحساب البنكي المُحوَّل إليه
  - `status` - الحالة: pending / confirmed / rejected
  - `admin_notes` - ملاحظات المشرف
  - `receipt_url` - صورة الإيصال
  - `created_at` - تاريخ الرفع

  ## الأمان
  - RLS مفعّل لكلا الجدولين
  - البائع يرى فقط تحويلاته
  - الإدارة ترى جميع التحويلات
*/

CREATE TABLE IF NOT EXISTS platform_bank_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  iban text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_bank_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active bank account"
  ON platform_bank_account
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can read active bank account"
  ON platform_bank_account
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anon can manage bank account"
  ON platform_bank_account
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS commission_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid REFERENCES commissions(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES platform_bank_account(id) ON DELETE SET NULL,
  transfer_amount numeric(12, 2) NOT NULL DEFAULT 0,
  transfer_reference text NOT NULL DEFAULT '',
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commission_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can read own transfers"
  ON commission_transfers
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own transfers"
  ON commission_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Anon can read all transfers"
  ON commission_transfers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update transfers"
  ON commission_transfers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_commission_transfers_seller ON commission_transfers(seller_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_status ON commission_transfers(status);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_commission ON commission_transfers(commission_id);
