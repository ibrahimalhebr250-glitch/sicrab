/*
  # إصلاح محفز تحديث الأداء التلقائي

  1. المشكلة
    - المحفز الحالي لا يحدث البيانات بشكل صحيح
    - الاستعلام المعقد لا يعطي النتائج المطلوبة
    
  2. الحل
    - تبسيط المحفز ليحدث البيانات مباشرة
    - حساب الإحصائيات من كل سجل النشاطات لليوم
*/

-- محفز محسّن لتحديث الأداء
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
    COUNT(*) FILTER (WHERE resource_type = 'users'),
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

-- إعادة إنشاء المحفز
DROP TRIGGER IF EXISTS update_performance_on_activity ON admin_activity_logs;
CREATE TRIGGER update_performance_on_activity
  AFTER INSERT ON admin_activity_logs
  FOR EACH ROW
  WHEN (NEW.staff_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_performance_metrics();

-- تحديث البيانات الموجودة
SELECT update_staff_performance_from_activity();
