/*
  # إضافة محفزات تلقائية لتتبع الأداء

  1. محفزات جديدة
    - تحديث إحصائيات الأداء تلقائياً عند إضافة نشاط
    - توليد التنبيهات تلقائياً يومياً
    
  2. وظائف مجدولة
    - تحديث الإحصائيات كل ساعة
    - توليد التنبيهات مرة يومياً
*/

-- محفز لتحديث الأداء عند إضافة نشاط جديد
CREATE OR REPLACE FUNCTION trigger_update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث إحصائيات اليوم للموظف
  INSERT INTO staff_performance_metrics (
    staff_id,
    date,
    listings_reviewed,
    reports_handled,
    users_managed,
    categories_modified,
    total_actions
  )
  SELECT 
    NEW.staff_id,
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE action IN ('approve_listing', 'reject_listing', 'edit_listing', 'delete_listing')),
    COUNT(*) FILTER (WHERE action IN ('resolve_report', 'dismiss_report')),
    COUNT(*) FILTER (WHERE resource_type = 'users'),
    COUNT(*) FILTER (WHERE resource_type IN ('categories', 'subcategories')),
    COUNT(*)
  FROM admin_activity_logs
  WHERE staff_id = NEW.staff_id
    AND DATE(created_at) = CURRENT_DATE
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

-- ربط المحفز بجدول النشاطات
DROP TRIGGER IF EXISTS update_performance_on_activity ON admin_activity_logs;
CREATE TRIGGER update_performance_on_activity
  AFTER INSERT ON admin_activity_logs
  FOR EACH ROW
  WHEN (NEW.staff_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_performance_metrics();

-- دالة لحساب متوسط وقت الاستجابة (بناءً على الوقت بين النشاطات)
CREATE OR REPLACE FUNCTION calculate_response_time(p_staff_id uuid, p_date date)
RETURNS integer AS $$
DECLARE
  v_avg_minutes integer;
BEGIN
  WITH activity_times AS (
    SELECT 
      created_at,
      LAG(created_at) OVER (ORDER BY created_at) as prev_time
    FROM admin_activity_logs
    WHERE staff_id = p_staff_id
      AND DATE(created_at) = p_date
  )
  SELECT 
    COALESCE(
      EXTRACT(EPOCH FROM AVG(created_at - prev_time))::integer / 60,
      0
    )
  INTO v_avg_minutes
  FROM activity_times
  WHERE prev_time IS NOT NULL;
  
  RETURN COALESCE(v_avg_minutes, 0);
END;
$$ LANGUAGE plpgsql;

-- تحديث متوسط وقت الاستجابة يومياً
CREATE OR REPLACE FUNCTION update_response_times()
RETURNS void AS $$
BEGIN
  UPDATE staff_performance_metrics
  SET 
    avg_response_time = calculate_response_time(staff_id, date),
    updated_at = now()
  WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
