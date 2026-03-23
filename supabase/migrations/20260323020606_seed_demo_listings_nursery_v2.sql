/*
  # Seed Demo Listings for Nursery Marketplace (v2)

  Creates 27 realistic demo listings across all 7 categories.
  Images stored as JSONB arrays.
*/

DO $$
DECLARE
  v_user_id uuid := 'ceeb75ea-c23a-44e5-aa64-53b097397e8b';
  v_user2_id uuid := '0a5fdd06-b635-447c-b389-ad15470c301b';

  v_cat_fruit uuid := 'bf140c86-ecfc-41d8-bca2-7fe514f59666';
  v_cat_ornamental uuid := '1f7b45df-9d11-49be-b0cb-3e95a6a0e202';
  v_cat_palm uuid := 'c9ef5ac1-ee59-49c3-8a7b-9df1572ec181';
  v_cat_shrubs uuid := 'ad3d6f91-b4c8-4e4c-b0ab-3cb11dec0bb2';
  v_cat_indoor uuid := '9cbacfbe-f0bb-4604-9dae-a2ea9c4421a1';
  v_cat_herbs uuid := '8eaefc23-b341-441c-903f-e6d147ca68f0';
  v_cat_seeds uuid := '2f574b5c-dbe8-4edc-8d78-f3ad038f9d21';

  v_riyadh uuid := 'bdea3945-672c-47bc-944d-8ebaea08e9f4';
  v_jeddah uuid := 'e5b82f19-c458-4ef4-a5a9-478bf4c152c4';
  v_dammam uuid := 'dca40c26-67f4-43a7-b782-f9e6946e859a';
  v_taif uuid := 'f9ec8b9a-3bf0-4c3d-a554-532963cad9dd';
  v_madinah uuid := '76b6f4f4-a5c0-4018-b755-9d78a1f3da67';
  v_makkah uuid := '4a2d7d8c-425e-49e3-ab28-5a108875cbd8';
  v_abha uuid := '95e8868c-6406-439f-badc-bd211b0ebb31';
  v_tabuk uuid := 'b117572d-7de8-4ff8-96c3-7c252f7d5d5b';
  v_khobar uuid := 'e18bbe4c-b063-435b-9deb-28b4204d5ba7';

  v_img1 jsonb := '["https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg","https://images.pexels.com/photos/4750274/pexels-photo-4750274.jpeg"]';
  v_img2 jsonb := '["https://images.pexels.com/photos/4750274/pexels-photo-4750274.jpeg","https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg"]';
  v_img3 jsonb := '["https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg"]';
  v_img4 jsonb := '["https://images.pexels.com/photos/4750274/pexels-photo-4750274.jpeg"]';
  v_img5 jsonb := '["https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg","https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg"]';
  v_img6 jsonb := '["https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg"]';

BEGIN

  -- === أشجار مثمرة ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_fruit, v_taif, 'أشجار رمان طائفية عمرها 5 سنوات - إنتاج عالي', 'للبيع أشجار رمان أصيلة من الطائف، عمرها 5 سنوات وبدأت في الإنتاج. الشجرة تعطي ثمار كبيرة الحجم ذات لون أحمر داكن وطعم حلو. مزروعة في أكياس كبيرة وسهلة النقل. مناسبة للحدائق المنزلية والمزارع. السقي كل أسبوعين في الصيف.', 180, 'fixed', 20, 'قطعة', 'جديد', v_img1, 'مشتل الطائف الأخضر', '0551234567', '0551234567', v_user_id, true, 142, 18, 'ashjar-roman-taif-5-sanawat', '{"tree_type":"رمان","tree_age":"3 إلى 5 سنوات","tree_size":"متوسطة (1-3 متر)","quantity_available":20}'::jsonb, now() - interval '3 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_fruit, v_riyadh, 'أشجار زيتون تونسي - جاهزة للزراعة بأصناف ممتازة', 'نوفر أشجار زيتون مستوردة من تونس بأصناف ممتازة (أربيكين - قرنيكي). الأشجار عمرها من 3 إلى 8 سنوات وجاهزة للإنتاج. تتحمل الجفاف والحر الشديد وتنمو بشكل ممتاز في تربة السعودية. نوفر خدمة التوصيل داخل الرياض.', 350, 'negotiable', 50, 'قطعة', 'جديد', v_img2, 'مؤسسة الزيتون الذهبي', '0501234567', '0501234567', v_user2_id, true, 89, 12, 'ashjar-zaytoun-tunis-jadida', '{"tree_type":"زيتون","tree_age":"3 إلى 5 سنوات","tree_size":"متوسطة (1-3 متر)","quantity_available":50}'::jsonb, now() - interval '5 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_fruit, v_jeddah, 'شجرة ليمون مثمرة طول 3 متر - مناسبة للأرض والأحواض', 'شجرة ليمون ناضجة عمرها 10 سنوات، طولها حوالي 3 متر، تعطي ثمار على مدار السنة. الشجرة صحية وخضراء ومعتنى بها جيداً. تحتاج سقي منتظم وأسمدة دورية. مناسبة لزراعتها في الأرض مباشرة أو في حوض كبير.', 500, 'negotiable', 1, 'قطعة', 'جديد', v_img3, 'أبو محمد', '0566789012', '0566789012', v_user_id, true, 67, 9, 'shajara-laymun-jeddah-kbira', '{"tree_type":"ليمون","tree_age":"أكثر من 10 سنوات","tree_size":"كبيرة (3-5 متر)","quantity_available":1}'::jsonb, now() - interval '7 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_fruit, v_dammam, 'شتلات مانجو هندي أصيل - للمزارع والأحواض الكبيرة', 'شتلات مانجو صغيرة من الصنف الهندي الأصيل، عمرها سنة ونصف. الشتلة في كيس 5 لتر جاهزة للزراعة. الصنف يتحمل الجو الحار ويعطي ثمار صفراء لذيذة. متوفر بالكميات للمزارع والمشاريع الخضراء. السعر مناسب للكميات الكبيرة.', 85, 'per_unit', 100, 'قطعة', 'جديد', v_img4, 'مشتل الشرقية', '0531234567', '0531234567', v_user2_id, true, 54, 7, 'shatilat-manga-hindi-dammam', '{"tree_type":"مانجو","tree_age":"أقل من سنة","tree_size":"صغيرة (أقل من متر)","quantity_available":100}'::jsonb, now() - interval '10 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_fruit, v_abha, 'أشجار تفاح جبلية من عسير - إنتاج موسمي ممتاز', 'أشجار تفاح أصيلة من جبال عسير البارد. عمرها من 5 إلى 7 سنوات وتعطي إنتاج ممتاز صيفاً. مزروعة بالطريقة الطبيعية بدون مبيدات. حجمها متوسط ومناسبة للبيوت والمزارع الصغيرة. للجادين فقط والمعاينة متاحة.', 250, 'fixed', 15, 'قطعة', 'جديد', v_img1, 'مزرعة جبال عسير', '0571234567', '0571234567', v_user_id, true, 38, 5, 'ashjar-tuffah-asir-jabali', '{"tree_type":"تفاح","tree_age":"5 إلى 10 سنوات","tree_size":"متوسطة (1-3 متر)","quantity_available":15}'::jsonb, now() - interval '14 days');

  -- === أشجار زينة ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_ornamental, v_riyadh, 'أشجار كازورينا كبيرة للتشجير والحدائق', 'أشجار كازورينا (أثل) كبيرة مناسبة للتشجير والحدائق العامة والخاصة. الأشجار طولها من 3 إلى 5 متر وجذورها قوية. تتحمل الجفاف والحر الشديد وتنمو بسرعة. مناسبة جداً لمناخ السعودية. خصم للكميات فوق 50 شجرة.', 280, 'negotiable', 80, 'قطعة', 'جديد', v_img5, 'مشتل الخضراء - الرياض', '0501112233', '0501112233', v_user_id, true, 203, 31, 'ashjar-kazwarina-riyadh-tashjer', '{"tree_type":"كازورينا","tree_age":"3 إلى 5 سنوات","tree_size":"كبيرة (3-5 متر)","quantity_available":80}'::jsonb, now() - interval '2 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_ornamental, v_jeddah, 'فيكس بنجامينا منسق للديكور الخارجي والفلل', 'فيكس بنجامينا بأشكال مختلفة منسقة (دائرة ومثلث ومقص). مناسبة لتزيين مداخل الفلل والمطاعم والفنادق. كل شجرة في وعاء أنيق. يمكن التشكيل حسب الطلب. نوفر خدمة الصيانة الدورية بعد البيع. معرضنا في جدة حي الروضة.', 450, 'fixed', 30, 'قطعة', 'جديد', v_img4, 'ديكور أخضر - جدة', '0561112233', '0561112233', v_user2_id, true, 156, 22, 'fikus-binjamina-decoration-jeddah', '{"tree_type":"فيكس","tree_age":"سنة إلى 3 سنوات","tree_size":"متوسطة (1-3 متر)","quantity_available":30}'::jsonb, now() - interval '4 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_ornamental, v_madinah, 'أشجار سدر ظليلة كبيرة من المدينة المنورة', 'أشجار سدر أصيلة من المدينة المنورة، كبيرة وظليلة. عمرها أكثر من 10 سنوات وتعطي ظلاً واسعاً. الشجرة مقدسة في التراث الإسلامي وتزين الحدائق بشكل رائع. طولها يتجاوز 4 متر. مناسبة للمساجد والمدارس والحدائق العامة.', 800, 'negotiable', 5, 'قطعة', 'جديد', v_img3, 'مشتل المدينة', '0541112233', '0541112233', v_user_id, true, 91, 14, 'ashjar-sidr-madinah-thlil', '{"tree_type":"سدر","tree_age":"أكثر من 10 سنوات","tree_size":"كبيرة جداً (أكثر من 5 متر)","quantity_available":5}'::jsonb, now() - interval '8 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_ornamental, v_khobar, 'يوكا فيليفيرا عصرية للمداخل والمناطق الخارجية', 'يوكا فيليفيرا في أحواض كبيرة، مناسبة للمداخل والمناطق الخارجية. شكلها المميز يضيف لمسة عصرية للمكان. تتحمل الملوحة والجو الحار. متوفر بأحجام من متر ونصف إلى ثلاثة أمتار. نوفر ضمان 3 أشهر.', 320, 'per_unit', 25, 'قطعة', 'جديد', v_img2, 'مشتل الخبر', '0511112233', '0511112233', v_user2_id, true, 72, 10, 'yucca-filifera-khobar', '{"tree_type":"يوكا","tree_age":"سنة إلى 3 سنوات","tree_size":"متوسطة (1-3 متر)","quantity_available":25}'::jsonb, now() - interval '11 days');

  -- === النخيل ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_palm, v_riyadh, 'نخيل واشنطونيا كبير للمجمعات السكنية والشوارع', 'نخيل واشنطونيا بارتفاعات من 3 إلى 8 متر. مناسب للمجمعات السكنية وشوارع الدخول والحدائق العامة. الجذور قوية والنخلة صحية. تتحمل الظروف الجوية القاسية. نوفر خدمة النقل والزراعة داخل الرياض.', 1200, 'negotiable', 40, 'قطعة', 'جديد', v_img1, 'مشتل النخيل الملكي', '0501119999', '0501119999', v_user_id, true, 318, 47, 'nakhl-washingtonia-riyadh-kbir', '{"palm_type":"نخيل واشنطونيا","palm_height":"3-5 متر","palm_age":"5-10 سنوات","quantity_available":40}'::jsonb, now() - interval '1 day');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_palm, v_dammam, 'نخيل تمر خلاص - إنتاج عالي ومضمون', 'نخيل تمر أصيل صنف خلاص شهير بإنتاجه الوفير. عمر النخلة من 5 إلى 8 سنوات وبدأت الإنتاج. الطول من 2 إلى 4 متر. مثالية للمزارع ومشاريع إنتاج التمر. الخلاص من أفضل أصناف التمر السعودية.', 950, 'negotiable', 25, 'قطعة', 'جديد', v_img4, 'مزارع الشرقية', '0531119999', '0531119999', v_user2_id, true, 245, 38, 'nakhl-tamer-khallas-dammam', '{"palm_type":"نخيل تمر خلاص","palm_height":"1-3 متر","palm_age":"5-10 سنوات","quantity_available":25}'::jsonb, now() - interval '3 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_palm, v_makkah, 'نخيل جوز الهند الاستوائي - طابع نادر ومميز', 'نخيل جوز الهند الاستوائي، مناسب للمناطق الدافئة. الطول من 2 إلى 3 متر. يعطي ثمار بعد 5 سنوات. شكله الجميل يضيف طابعاً استوائياً للحدائق والمنتجعات. يحتاج ري منتظم وتربة جيدة الصرف.', 700, 'fixed', 10, 'قطعة', 'جديد', v_img3, 'مشتل مكة الخضراء', '0551119999', '0551119999', v_user_id, true, 133, 19, 'nakhl-jawz-hind-makkah', '{"palm_type":"نخيل جوز الهند","palm_height":"1-3 متر","palm_age":"أقل من 3 سنوات","quantity_available":10}'::jsonb, now() - interval '6 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_palm, v_tabuk, 'نخلة سكري بالغة عمرها 20 سنة - إنتاج هذا الموسم محمول', 'نخيل تمر صنف سكري أصلها من القصيم. النخلة بالغة عمرها أكثر من 20 سنة وطولها يتجاوز 8 أمتار. إنتاج هذا الموسم محمول. نبيع بسبب ترتيب خاص. للمزارعين والمهتمين بزراعة التمر فقط.', 3500, 'negotiable', 3, 'قطعة', 'جديد', v_img2, 'أبو عبدالله', '0591119999', '0591119999', v_user2_id, true, 178, 26, 'nakhl-tamer-sukari-tabuk-baliigh', '{"palm_type":"نخيل تمر سكري","palm_height":"أكثر من 8 متر","palm_age":"أكثر من 20 سنة","quantity_available":3}'::jsonb, now() - interval '9 days');

  -- === الشجيرات والسياج ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_shrubs, v_riyadh, 'بوغنفيل ملوّن بأصناف مختلفة للسياج والتسلق', 'بوغنفيل بألوان متعددة (أحمر، برتقالي، أبيض، وردي) مناسبة للسياج والجدران. النباتات متجذرة جيداً. تزهر طوال السنة في المناخ الدافئ. تتحمل الجفاف وتنمو بسرعة. توصيل داخل الرياض.', 45, 'per_unit', 200, 'قطعة', 'جديد', v_img5, 'مشتل الأزهار الملونة', '0501115555', '0501115555', v_user_id, true, 267, 41, 'bougainvillea-mulawwin-riyadh', '{"shrub_type":"بوغنفيل","purpose":"سياج وتحديد حدود","quantity_available":200}'::jsonb, now() - interval '2 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_shrubs, v_jeddah, 'ياسمين عربي أبيض عطري - رائحة زكية مميزة', 'ياسمين عربي أصيل ذو رائحة عطرية رائعة، مناسب للسياجات والشرفات. الشجيرة عمرها سنتان وبدأت في الإزهار. تزهر في الربيع والصيف. مثالية لتزيين الحدائق والمدخل.', 65, 'fixed', 80, 'قطعة', 'جديد', v_img4, 'مشتل العطور الخضراء', '0561115555', '0561115555', v_user2_id, true, 189, 28, 'yasmin-arabi-abyad-jeddah', '{"shrub_type":"ياسمين","purpose":"تجميل وزينة","quantity_available":80}'::jsonb, now() - interval '5 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_shrubs, v_khobar, 'دفلى حمراء وبيضاء للحدائق الكبيرة والمشاريع', 'دفلى (أوليندر) بألوان مختلفة. تتحمل الحر والجفاف وتزهر طوال السنة. مناسبة جداً للمناخ السعودي. تنمو بسرعة وتشكل سياجاً جميلاً. متوفر بكميات كبيرة للمشاريع.', 35, 'per_unit', 300, 'قطعة', 'جديد', v_img3, 'مشتل الخليج', '0511115555', '0511115555', v_user_id, true, 143, 21, 'daflaa-hamraa-baydaa-khobar', '{"shrub_type":"دفلى","purpose":"ظل وتبريد","quantity_available":300}'::jsonb, now() - interval '12 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_shrubs, v_taif, 'تبروزة صفراء مزهرة للسياج الملون', 'تبروزة (كاسيا) صفراء زاهية، تزهر بكثافة وتعطي منظراً رائعاً. مناسبة للمدن الباردة مثل الطائف. تنمو بسرعة وتشكل سياجاً كثيفاً. مناسبة للحدائق المدرسية والمرافق العامة.', 55, 'fixed', 60, 'قطعة', 'جديد', v_img2, 'مشتل الطائف الأخضر', '0551115555', '0551115555', v_user2_id, true, 98, 14, 'tabrawza-safra-taif-siyaj', '{"shrub_type":"تبروزة","purpose":"متعدد الأغراض","quantity_available":60}'::jsonb, now() - interval '15 days');

  -- === النباتات الداخلية ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_indoor, v_riyadh, 'مجموعة صبار نادر بأشكال مميزة في أواني فخارية', 'صبار بأشكال وأحجام متنوعة ونادرة في أواني فخارية مزخرفة. مثالية لتزيين المكاتب والمنازل. تحتاج ريا قليلاً وتتحمل الإهمال. مناسبة للمبتدئين في تربية النباتات. متوفر أصناف: صبار المغزل، الإريو كاكتس وغيرها.', 120, 'per_unit', 50, 'قطعة', 'جديد', v_img5, 'بيت الصبار والعصاريات', '0501118888', '0501118888', v_user_id, true, 334, 52, 'sabbar-mutanawwa-nadir-riyadh', '{"plant_type":"صبار","plant_size":"صغير (أقل من 30 سم)","pot_type":"وعاء فخار","quantity_available":50}'::jsonb, now() - interval '1 day');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_indoor, v_jeddah, 'سانسيفيريا منقي الهواء بأحجام مختلفة', 'سانسيفيريا (لسان الحماة) معروف بتنقيته للهواء وتحمله للإهمال. يعيش في الضوء القليل ولا يحتاج ريا كثيراً. مثالي للمكاتب والغرف. متوفر بثلاثة أحجام في أواني خزفية أنيقة.', 60, 'per_unit', 40, 'قطعة', 'جديد', v_img4, 'ستوديو الخضرة - جدة', '0561118888', '0561118888', v_user2_id, true, 221, 33, 'sansevieria-munqi-jeddah', '{"plant_type":"سانسيفيريا","plant_size":"متوسط (30-60 سم)","pot_type":"وعاء خزف","quantity_available":40}'::jsonb, now() - interval '4 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_indoor, v_dammam, 'بوتس متسلق للجدران والرفوف - ينمو بسرعة', 'بوتس أوراق خضراء لامعة، متسلق جميل يزين الجدران والرفوف. ينمو بسرعة ويتحمل الضوء الخفيف. يمكن تعليقه أو وضعه في أصص معلقة. لا يحتاج عناية كثيرة. متوفر بالوعاء المعلق أو الأرضي.', 40, 'per_unit', 60, 'قطعة', 'جديد', v_img3, 'خضرة الدمام', '0531118888', '0531118888', v_user_id, true, 167, 24, 'pothus-mutasalliq-dammam', '{"plant_type":"بوتس","plant_size":"صغير (أقل من 30 سم)","pot_type":"وعاء بلاستيك","quantity_available":60}'::jsonb, now() - interval '7 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_indoor, v_riyadh, 'أوركيد فالينوبسيس هدية مميزة بألوان متعددة', 'أوركيد فالينوبسيس بألوان متعددة: أبيض، وردي، أرجواني، أصفر. في أواني خزفية شفافة أنيقة. يزهر 3 أشهر متواصلة. مثالي كهدية لجميع المناسبات. يحتاج ضوءاً غير مباشراً. التغليف الهدايا متاح بإضافة 15 ريال.', 95, 'fixed', 30, 'قطعة', 'جديد', v_img6, 'هدايا خضراء - الرياض', '0501118899', '0501118899', v_user2_id, true, 289, 44, 'orkid-hadia-riyadh', '{"plant_type":"أوركيد","plant_size":"صغير (أقل من 30 سم)","pot_type":"وعاء خزف","quantity_available":30}'::jsonb, now() - interval '2 days');

  -- === الأعشاب والنباتات الطبية ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_herbs, v_riyadh, 'نعناع طازج بأصناف مختلفة للمطابخ والشرفات', 'نعناع طازج بأصناف متعددة: نعناع بلدي، نعناع مغربي، نعناع فلفلي. الأصص جاهزة للوضع في المطبخ أو الشرفة. محلي الزراعة وبدون مبيدات. مناسب لعشاق الشاي والمشروبات الطبيعية. توصيل داخل الرياض مجاني فوق 5 أصص.', 25, 'per_unit', 100, 'قطعة', 'جديد', v_img3, 'مزرعة الأعشاب العضوية', '0501117777', '0501117777', v_user_id, true, 412, 63, 'naanaa-taaza-riyadh', '{"herb_type":"نعناع","form":"نبات حي","quantity_available":100}'::jsonb, now() - interval '1 day');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_herbs, v_taif, 'لافندر عطري أصيل من الطائف - رائحة ساحرة', 'لافندر حقيقي بالرائحة العطرية الأصيلة، مزروع في الطائف. يُستخدم لتعطير الجو ومضادة الحشرات وفي الطب الشعبي. يحتاج ضوءاً كاملاً وريا معتدلاً. الرائحة طبيعية تماماً وليست صناعية.', 40, 'fixed', 60, 'قطعة', 'جديد', v_img4, 'مزرعة الطائف العطرية', '0551117777', '0551117777', v_user2_id, true, 198, 29, 'lavender-atri-taif', '{"herb_type":"لافندر","form":"نبات حي","quantity_available":60}'::jsonb, now() - interval '6 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_herbs, v_jeddah, 'مجموعة أعشاب الطهي - ريحان وزعتر وروزماري ومريمية', 'مجموعة متكاملة لعشاق الطبخ: ريحان إيطالي، زعتر سوري، روزماري، مريمية. كل عشبة في وعاء مستقل مع بطاقة تعريفية. عضوية 100% وجاهزة للاستخدام. تأتي في صندوق هدايا أنيق. مثالية هدية لمحبي الطبخ.', 150, 'fixed', 20, 'مجموعة', 'جديد', v_img1, 'حديقة الطهي - جدة', '0561117777', '0561117777', v_user_id, true, 276, 41, 'majmouat-ashab-tabkh-jeddah', '{"herb_type":"ريحان","form":"نبات حي","quantity_available":20}'::jsonb, now() - interval '3 days');

  -- === بذور وشتلات ===

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_seeds, v_riyadh, 'بذور خضروات عضوية محلية للحديقة المنزلية', 'مجموعة بذور خضروات عضوية 100% محلية. تشمل: طماطم، فلفل، باذنجان، خيار، كوسا، بقدونس. كل صنف في كيس مغلق مع تعليمات الزراعة. نسبة الإنبات 85% مضمونة. صالحة للزراعة في الأرض والأحواض.', 35, 'per_unit', 150, 'كيس', 'جديد', v_img4, 'مزرعة البذور الطبيعية', '0501116666', '0501116666', v_user2_id, true, 356, 54, 'buthour-khudar-udwi-riyadh', '{"seed_type":"بذور خضروات","quantity_description":"كيس 10 جرام (50-100 بذرة)","variety":"صنف محلي عضوي"}'::jsonb, now() - interval '2 days');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_seeds, v_dammam, 'شتلات طماطم جاهزة للزراعة الفورية - أصناف مختلفة', 'شتلات طماطم بأصناف مختلفة (شيري، بيف ستيك، روما) عمرها 3 أسابيع. جذرها متطور وجاهزة للزراعة. تبدأ في الإنتاج خلال 45-60 يوم. تحتاج ريا يومياً وضوءاً كاملاً. متوفر بكميات للمزارع الصغيرة.', 8, 'per_unit', 500, 'قطعة', 'جديد', v_img3, 'مشتل الشرقية الحديث', '0531116666', '0531116666', v_user_id, true, 423, 65, 'shatilat-tamatim-dammam', '{"seed_type":"شتلات خضروات","quantity_description":"وعاء صغير 0.5 لتر","variety":"أصناف أجنبية محسّنة"}'::jsonb, now() - interval '1 day');

  INSERT INTO listings (id, category_id, city_id, title, description, price, price_type, quantity, unit, condition, images, contact_name, contact_phone, whatsapp_number, user_id, is_active, views_count, whatsapp_clicks, slug, custom_fields, created_at) VALUES
  (gen_random_uuid(), v_cat_seeds, v_jeddah, 'بذور زهور ملونة للحدائق والشرفات', 'مجموعة بذور زهور بألوان زاهية تناسب الحدائق والشرفات. تشمل: قطيفة، ذرة الزينة، قرنفل، ربيعية. الأكياس مع تعليمات مفصلة. تزهر في الربيع والخريف. مناسبة للأطفال لتعلم الزراعة. خصم على المجموعة الكاملة.', 20, 'per_unit', 200, 'كيس', 'جديد', v_img2, 'بذور الألوان - جدة', '0561116666', '0561116666', v_user2_id, true, 187, 27, 'buthour-zuhur-mulawinah-jeddah', '{"seed_type":"بذور زهور","quantity_description":"كيس 5 جرام (30-50 بذرة)","variety":"أصناف مستوردة متنوعة"}'::jsonb, now() - interval '8 days');

END $$;
