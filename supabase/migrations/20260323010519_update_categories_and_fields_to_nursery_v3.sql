/*
  # Update Categories and Category Fields to Nursery/Trees Marketplace

  Replaces all old scrap-related categories and fields with nursery/trees marketplace content.

  New Categories:
  - أشجار مثمرة (Fruit Trees)
  - أشجار زينة (Ornamental Trees)
  - النخيل (Palm Trees)
  - الشجيرات والسياج (Shrubs & Hedges)
  - النباتات الداخلية (Indoor Plants)
  - الأعشاب والنباتات الطبية (Herbs & Medicinal Plants)
  - بذور وشتلات (Seeds & Seedlings)
*/

DELETE FROM category_fields;
DELETE FROM subcategories;
DELETE FROM categories;

INSERT INTO categories (id, name_ar, name_en, icon, order_index, slug)
VALUES
  (gen_random_uuid(), 'أشجار مثمرة', 'Fruit Trees', 'Recycle', 1, 'fruit-trees'),
  (gen_random_uuid(), 'أشجار زينة', 'Ornamental Trees', 'Box', 2, 'ornamental-trees'),
  (gen_random_uuid(), 'النخيل', 'Palm Trees', 'Factory', 3, 'palm-trees'),
  (gen_random_uuid(), 'الشجيرات والسياج', 'Shrubs & Hedges', 'Building', 4, 'shrubs-hedges'),
  (gen_random_uuid(), 'النباتات الداخلية', 'Indoor Plants', 'Container', 5, 'indoor-plants'),
  (gen_random_uuid(), 'الأعشاب والنباتات الطبية', 'Herbs & Medicinal', 'Warehouse', 6, 'herbs-medicinal'),
  (gen_random_uuid(), 'بذور وشتلات', 'Seeds & Seedlings', 'Layers', 7, 'seeds-seedlings');

DO $$
DECLARE
  v_cat_id uuid;
BEGIN

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'أشجار مثمرة';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع الشجرة', 'tree_type', 'select', '["تين","رمان","زيتون","تفاح","خوخ","برتقال","ليمون","مانجو","أفوكادو","عنب","أخرى"]'::jsonb, false, true, 'اختر نوع الشجرة', 1),
    (v_cat_id, 'عمر الشجرة', 'tree_age', 'select', '["أقل من سنة","سنة إلى 3 سنوات","3 إلى 5 سنوات","5 إلى 10 سنوات","أكثر من 10 سنوات"]'::jsonb, false, true, 'اختر عمر الشجرة', 2),
    (v_cat_id, 'حجم الشجرة', 'tree_size', 'select', '["صغيرة (أقل من متر)","متوسطة (1-3 متر)","كبيرة (3-5 متر)","كبيرة جداً (أكثر من 5 متر)"]'::jsonb, false, false, 'اختر حجم الشجرة', 3),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 10 أشجار', 4);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'أشجار زينة';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع الشجرة', 'tree_type', 'select', '["عرعر","سرو","صنوبر","يوكا","فيكس","بوتس","كازورينا","غاف","سدر","أخرى"]'::jsonb, false, true, 'اختر نوع الشجرة', 1),
    (v_cat_id, 'عمر الشجرة', 'tree_age', 'select', '["أقل من سنة","سنة إلى 3 سنوات","3 إلى 5 سنوات","5 إلى 10 سنوات","أكثر من 10 سنوات"]'::jsonb, false, false, 'اختر عمر الشجرة', 2),
    (v_cat_id, 'حجم الشجرة', 'tree_size', 'select', '["صغيرة (أقل من متر)","متوسطة (1-3 متر)","كبيرة (3-5 متر)","كبيرة جداً (أكثر من 5 متر)"]'::jsonb, false, false, 'اختر حجم الشجرة', 3),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 20 شجرة', 4);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'النخيل';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع النخلة', 'palm_type', 'select', '["نخيل تمر مدقق","نخيل تمر خلاص","نخيل تمر سكري","نخيل جوز الهند","نخيل واشنطونيا","نخيل زينة","أخرى"]'::jsonb, false, true, 'اختر نوع النخلة', 1),
    (v_cat_id, 'طول النخلة', 'palm_height', 'select', '["أقل من متر","1-3 متر","3-5 متر","5-8 متر","أكثر من 8 متر"]'::jsonb, false, true, 'اختر طول النخلة', 2),
    (v_cat_id, 'العمر التقريبي', 'palm_age', 'select', '["أقل من 3 سنوات","3-5 سنوات","5-10 سنوات","10-20 سنة","أكثر من 20 سنة"]'::jsonb, false, false, 'اختر العمر التقريبي', 3),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 5 نخلات', 4);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'الشجيرات والسياج';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع الشجيرة', 'shrub_type', 'select', '["دفلى","ثيتيا","أكاسيا","بوغنفيل","ياسمين","ورد البراري","تبروزة","أخرى"]'::jsonb, false, true, 'اختر نوع الشجيرة', 1),
    (v_cat_id, 'الغرض', 'purpose', 'select', '["سياج وتحديد حدود","تجميل وزينة","ظل وتبريد","متعدد الأغراض"]'::jsonb, false, false, 'اختر الغرض', 2),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 50 شجيرة', 3);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'النباتات الداخلية';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع النبات', 'plant_type', 'select', '["فيكس","بوتس","صبار","سانسيفيريا","سيلوم","باندانوس","أوركيد","ديفنباخيا","أخرى"]'::jsonb, false, true, 'اختر نوع النبات', 1),
    (v_cat_id, 'حجم النبات', 'plant_size', 'select', '["صغير (أقل من 30 سم)","متوسط (30-60 سم)","كبير (60-100 سم)","كبير جداً (أكثر من 100 سم)"]'::jsonb, false, false, 'اختر حجم النبات', 2),
    (v_cat_id, 'نوع الوعاء', 'pot_type', 'select', '["وعاء بلاستيك","وعاء خزف","وعاء فخار","وعاء معدن","بدون وعاء"]'::jsonb, false, false, 'اختر نوع الوعاء', 3),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 5 نباتات', 4);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'الأعشاب والنباتات الطبية';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع العشبة', 'herb_type', 'select', '["ريحان","نعناع","روزماري","زعتر","مريمية","لافندر","شيح","سنط","أخرى"]'::jsonb, false, true, 'اختر نوع العشبة', 1),
    (v_cat_id, 'الشكل', 'form', 'select', '["نبات حي","بذور مجففة","شتلات","قصاصات للتكاثر"]'::jsonb, false, false, 'اختر الشكل', 2),
    (v_cat_id, 'الكمية المتاحة', 'quantity_available', 'number', '[]'::jsonb, false, false, 'مثال: 10 أصص', 3);

  SELECT id INTO v_cat_id FROM categories WHERE name_ar = 'بذور وشتلات';
  INSERT INTO category_fields (category_id, field_name, field_key, field_type, field_options, use_subcategories, is_required, placeholder, order_index)
  VALUES
    (v_cat_id, 'نوع البذرة أو الشتلة', 'seed_type', 'select', '["بذور خضروات","بذور أشجار","بذور أعشاب","بذور زهور","شتلات خضروات","شتلات أشجار","شتلات زهور","أخرى"]'::jsonb, false, true, 'اختر النوع', 1),
    (v_cat_id, 'الكمية', 'quantity_description', 'text', '[]'::jsonb, false, false, 'مثال: كيس 500 جرام أو 100 بذرة', 2),
    (v_cat_id, 'الصنف أو المنشأ', 'variety', 'text', '[]'::jsonb, false, false, 'مثال: صنف محلي أو مستورد', 3);

END $$;
