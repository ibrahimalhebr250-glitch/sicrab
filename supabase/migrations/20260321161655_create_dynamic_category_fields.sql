/*
  # إنشاء نظام الحقول الديناميكية للفئات

  1. جداول جديدة
    - `category_fields` - تعريف الحقول المخصصة لكل فئة
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key) - ربط بالفئة
      - `field_name` (text) - اسم الحقل بالعربية
      - `field_key` (text) - مفتاح الحقل للبرمجة
      - `field_type` (text) - نوع الحقل (text, number, select, textarea)
      - `field_options` (jsonb) - خيارات للحقول من نوع select
      - `is_required` (boolean) - هل الحقل مطلوب
      - `placeholder` (text) - نص توضيحي
      - `order_index` (integer) - ترتيب الحقل
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على الجدول الجديد
    - السماح للجميع بالقراءة
    - السماح للمسؤولين فقط بالكتابة
*/

-- إنشاء جدول الحقول المخصصة للفئات
CREATE TABLE IF NOT EXISTS category_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  field_key text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'textarea')),
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  placeholder text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE category_fields ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة
CREATE POLICY "Anyone can view category fields"
  ON category_fields FOR SELECT
  TO authenticated, anon
  USING (true);

-- السماح للمسؤولين بالإدارة الكاملة
CREATE POLICY "Admins can manage category fields"
  ON category_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_category_fields_category_id ON category_fields(category_id);
CREATE INDEX IF NOT EXISTS idx_category_fields_order ON category_fields(category_id, order_index);

-- إضافة حقول ديناميكية للإعلانات لتخزين البيانات المخصصة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE listings ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- إدراج حقول مخصصة لكل فئة (أمثلة)

-- الحصول على معرفات الفئات أولاً ثم إدراج الحقول
DO $$
DECLARE
  cat_metals uuid;
  cat_plastic uuid;
  cat_paper uuid;
  cat_electronics uuid;
  cat_glass uuid;
  cat_textiles uuid;
BEGIN
  -- الحصول على معرفات الفئات
  SELECT id INTO cat_metals FROM categories WHERE name_ar = 'معادن' LIMIT 1;
  SELECT id INTO cat_plastic FROM categories WHERE name_ar = 'بلاستيك' LIMIT 1;
  SELECT id INTO cat_paper FROM categories WHERE name_ar = 'ورق وكرتون' LIMIT 1;
  SELECT id INTO cat_electronics FROM categories WHERE name_ar = 'إلكترونيات' LIMIT 1;
  SELECT id INTO cat_glass FROM categories WHERE name_ar = 'زجاج' LIMIT 1;
  SELECT id INTO cat_textiles FROM categories WHERE name_ar = 'منسوجات' LIMIT 1;

  -- حقول فئة المعادن
  IF cat_metals IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_metals, 'نوع المعدن', 'metal_type', 'select', '["حديد", "ألومنيوم", "نحاس", "برونز", "فولاذ", "معدن مخلوط"]'::jsonb, true, 'اختر نوع المعدن', 1),
      (cat_metals, 'درجة النقاء', 'purity_grade', 'select', '["عالية جداً (95%+)", "عالية (85-95%)", "متوسطة (70-85%)", "منخفضة (أقل من 70%)"]'::jsonb, false, 'اختر درجة النقاء', 2),
      (cat_metals, 'الوزن التقريبي', 'weight_estimate', 'text', '[]'::jsonb, false, 'مثال: 5 طن أو 500 كيلو', 3);
  END IF;

  -- حقول فئة البلاستيك
  IF cat_plastic IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_plastic, 'نوع البلاستيك', 'plastic_type', 'select', '["PET (بولي إيثيلين تيريفثاليت)", "HDPE (بولي إيثيلين عالي الكثافة)", "PVC (بولي فينيل كلوريد)", "LDPE (بولي إيثيلين منخفض الكثافة)", "PP (بولي بروبيلين)", "PS (بولي ستايرين)", "مخلوط"]'::jsonb, true, 'اختر نوع البلاستيك', 1),
      (cat_plastic, 'اللون', 'color', 'select', '["شفاف", "أبيض", "أسود", "أزرق", "أخضر", "أحمر", "ألوان متعددة"]'::jsonb, false, 'اختر اللون الغالب', 2),
      (cat_plastic, 'الشكل', 'form', 'select', '["زجاجات", "أكياس", "أنابيب", "حاويات", "صفائح", "مفروم", "متنوع"]'::jsonb, false, 'اختر شكل المادة', 3);
  END IF;

  -- حقول فئة الورق والكرتون
  IF cat_paper IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_paper, 'نوع الورق', 'paper_type', 'select', '["كرتون مضلع", "كرتون عادي", "ورق أبيض", "ورق صحف", "ورق مجلات", "ورق مكاتب", "مخلوط"]'::jsonb, true, 'اختر نوع الورق', 1),
      (cat_paper, 'الحالة', 'paper_condition', 'select', '["نظيف وجاف", "نظيف مع رطوبة خفيفة", "يحتوي على شوائب قليلة", "يحتوي على شوائب كثيرة"]'::jsonb, false, 'اختر حالة المادة', 2),
      (cat_paper, 'التعبئة', 'packaging', 'select', '["مكبوس (بالات)", "مربوط (حزم)", "سائب (غير مكبوس)", "في أكياس"]'::jsonb, false, 'كيف تم تجهيز المادة؟', 3);
  END IF;

  -- حقول فئة الإلكترونيات
  IF cat_electronics IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_electronics, 'نوع الجهاز', 'device_type', 'select', '["كمبيوتر/لابتوب", "جوالات وتابلت", "شاشات تلفزيون", "أجهزة منزلية", "لوحات إلكترونية", "كابلات وأسلاك", "بطاريات", "متنوع"]'::jsonb, true, 'اختر نوع الجهاز', 1),
      (cat_electronics, 'حالة التشغيل', 'working_status', 'select', '["يعمل بشكل كامل", "يعمل جزئياً", "لا يعمل", "غير مختبر"]'::jsonb, false, 'هل الجهاز يعمل؟', 2),
      (cat_electronics, 'الكمية التقديرية', 'quantity_estimate', 'text', '[]'::jsonb, false, 'مثال: 20 جهاز أو 100 كيلو', 3);
  END IF;

  -- حقول فئة الزجاج
  IF cat_glass IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_glass, 'نوع الزجاج', 'glass_type', 'select', '["زجاج شفاف", "زجاج ملون", "زجاج نوافذ", "زجاج زجاجات", "زجاج مرايا", "زجاج مكسور", "مخلوط"]'::jsonb, true, 'اختر نوع الزجاج', 1),
      (cat_glass, 'اللون', 'glass_color', 'select', '["شفاف", "أخضر", "بني", "أزرق", "ألوان متعددة"]'::jsonb, false, 'اختر اللون الغالب', 2);
  END IF;

  -- حقول فئة المنسوجات
  IF cat_textiles IS NOT NULL THEN
    INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, is_required, placeholder, order_index)
    VALUES
      (cat_textiles, 'نوع القماش', 'textile_type', 'select', '["قطن", "صوف", "حرير", "بوليستر", "نايلون", "مخلوط", "متنوع"]'::jsonb, true, 'اختر نوع القماش', 1),
      (cat_textiles, 'الشكل', 'textile_form', 'select', '["ملابس مستعملة", "قصاصات قماش", "بكرات قماش", "بطانيات/مفارش", "أكياس خيش", "متنوع"]'::jsonb, false, 'اختر شكل المادة', 2),
      (cat_textiles, 'الحالة', 'textile_condition', 'select', '["نظيف وجاف", "يحتاج تنظيف", "ممزق/تالف", "مخلوط"]'::jsonb, false, 'اختر حالة المادة', 3);
  END IF;
END $$;
