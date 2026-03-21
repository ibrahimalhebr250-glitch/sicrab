/*
  # إضافة نظام المصادقة وملفات المستخدمين

  ## التغييرات الجديدة

  1. جداول جديدة
    - `profiles` - ملفات المستخدمين التي تحتوي على:
      - `id` (uuid, primary key, مرتبط بـ auth.users)
      - `full_name` (text, الاسم الكامل)
      - `phone` (text, رقم الجوال)
      - `avatar_url` (text, رابط صورة الملف الشخصي)
      - `bio` (text, نبذة عن المستخدم)
      - `created_at` (timestamp, تاريخ الإنشاء)
      - `updated_at` (timestamp, تاريخ آخر تحديث)

  2. تحديثات على الجداول الموجودة
    - إضافة عمود `user_id` إلى جدول `listings` لربط الإعلانات بالمستخدمين
    - إضافة foreign key constraint لضمان سلامة البيانات

  3. الأمان
    - تفعيل RLS على جدول `profiles`
    - سياسة للمستخدمين لقراءة جميع الملفات الشخصية
    - سياسة للمستخدمين لتعديل ملفاتهم الشخصية فقط
    - تحديث سياسات RLS لجدول `listings` لربطها بالمستخدمين
    - إنشاء دالة تلقائية لإنشاء ملف شخصي عند التسجيل

  ## ملاحظات مهمة
  - يتم إنشاء ملف شخصي تلقائياً عند تسجيل مستخدم جديد
  - رقم الجوال اختياري ويمكن إضافته لاحقاً
  - جميع الملفات الشخصية مرئية للجميع
  - كل مستخدم يستطيع تعديل ملفه الشخصي فقط
*/

-- إنشاء جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إضافة عمود user_id إلى جدول listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- تفعيل RLS على جدول profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للجميع بقراءة الملفات الشخصية
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- سياسة للسماح للمستخدمين بإدراج ملفاتهم الشخصية
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- سياسة للسماح للمستخدمين بتحديث ملفاتهم الشخصية فقط
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- تحديث سياسات RLS لجدول listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للجميع بقراءة الإعلانات
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

-- سياسة للسماح للمستخدمين المسجلين بإضافة إعلانات
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON listings;
CREATE POLICY "Authenticated users can insert listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بتحديث إعلاناتهم فقط
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بحذف إعلاناتهم فقط
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- دالة لإنشاء ملف شخصي تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', null)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتشغيل الدالة عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at في جدول profiles
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();