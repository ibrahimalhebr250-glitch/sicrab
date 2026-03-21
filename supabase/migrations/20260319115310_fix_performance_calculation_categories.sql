/*
  # تصحيح حساب فئات الأداء

  1. المشكلة
    - النشاطات المتعلقة بإدارة الموظفين (admin_staff) لا تُحسب
    - نشاطات الدخول والخروج لا تُحسب
    
  2. الحل
    - إضافة admin_staff ضمن users_managed
    - إضافة admin_session لحساب الأيام النشطة
    - تحديث الدالة لتشمل كل أنواع النشاطات
*/

-- تحديث دالة المحفز لتشمل كل النشاطات
CREATE OR REPLACE FUNCTION trigger_update_performance_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_listings_reviewed integer;
  v_reports_handled integer;
  v_users_managed integer;
  v_categories_modified integer;
  v_total_actions integer;
BEGIN
  -- حساب الإحصائيات من كل نشاطات اليوم للموظف
  SELECT 
    COUNT(*) FILTER (WHERE action IN ('approve_listing', 'reject_listing', 'edit_listing', 'delete_listing')),
    COUNT(*) FILTER (WHERE action IN ('resolve_report', 'dismiss_report')),
    COUNT(*) FILTER (WHERE resource_type IN ('users', 'admin_staff') AND action NOT IN ('login', 'logout')),
    COUNT(*) FILTER (WHERE resource_type IN ('categories', 'subcategories')),
    COUNT(*)
  INTO 
    v_listings_reviewed,
    v_reports_handled,
    v_users_managed,
    v_categories_modified,
    v_total_actions
  FROM admin_activity_logs
  WHERE staff_id = NEW.staff_id
    AND DATE(created_at) = DATE(NEW.created_at);
  
  -- إدراج أو تحديث السجل
  INSERT INTO staff_performance_metrics (
    staff_id,
    date,
    listings_reviewed,
    reports_handled,
    users_managed,
    categories_modified,
    total_actions,
    avg_response_time,
    updated_at
  )
  VALUES (
    NEW.staff_id,
    DATE(NEW.created_at),
    v_listings_reviewed,
    v_reports_handled,
    v_users_managed,
    v_categories_modified,
    v_total_actions,
    0,
    now()
  )
  ON CONFLICT (staff_id, date) 
  DO UPDATE SET
    listings_reviewed = EXCLUDED.listings_reviewed,
    reports_handled = EXCLUDED.reports_handled,
    users_managed = EXCLUDED.users_managed,
    categories_modified = EXCLUDED.categories_modified,
    total_actions = EXCLUDED.total_actions,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تحديث دالة التحديث الشامل
CREATE OR REPLACE FUNCTION update_staff_performance_from_activity()
RETURNS void AS $$
BEGIN
  INSERT INTO staff_performance_metrics (
    staff_id,
    date,
    listings_reviewed,
    reports_handled,
    users_managed,
    categories_modified,
    total_actions,
    updated_at
  )
  SELECT 
    staff_id,
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE action IN ('approve_listing', 'reject_listing', 'edit_listing', 'delete_listing')) as listings_reviewed,
    COUNT(*) FILTER (WHERE action IN ('resolve_report', 'dismiss_report')) as reports_handled,
    COUNT(*) FILTER (WHERE resource_type IN ('users', 'admin_staff') AND action NOT IN ('login', 'logout')) as users_managed,
    COUNT(*) FILTER (WHERE resource_type IN ('categories', 'subcategories')) as categories_modified,
    COUNT(*) as total_actions,
    now()
  FROM admin_activity_logs
  WHERE staff_id IS NOT NULL
  GROUP BY staff_id, DATE(created_at)
  ON CONFLICT (staff_id, date) 
  DO UPDATE SET
    listings_reviewed = EXCLUDED.listings_reviewed,
    reports_handled = EXCLUDED.reports_handled,
    users_managed = EXCLUDED.users_managed,
    categories_modified = EXCLUDED.categories_modified,
    total_actions = EXCLUDED.total_actions,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- تطبيق التحديث على البيانات الموجودة
SELECT update_staff_performance_from_activity();
