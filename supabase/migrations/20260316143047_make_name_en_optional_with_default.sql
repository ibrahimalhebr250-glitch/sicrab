/*
  # جعل حقول الأسماء الإنجليزية اختيارية مع قيم افتراضية

  1. التغييرات
    - جعل name_en في جدول categories اختياري مع قيمة افتراضية
    - جعل name_en في جدول subcategories اختياري مع قيمة افتراضية
    - القيمة الافتراضية ستكون نفس الاسم العربي
*/

-- تعديل جدول categories
ALTER TABLE categories 
ALTER COLUMN name_en DROP NOT NULL,
ALTER COLUMN name_en SET DEFAULT '';

-- تعديل جدول subcategories
ALTER TABLE subcategories 
ALTER COLUMN name_en DROP NOT NULL,
ALTER COLUMN name_en SET DEFAULT '';

-- تحديث القيم الفارغة الحالية
UPDATE categories SET name_en = name_ar WHERE name_en IS NULL OR name_en = '';
UPDATE subcategories SET name_en = name_ar WHERE name_en IS NULL OR name_en = '';
