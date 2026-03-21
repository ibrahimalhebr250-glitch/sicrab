/*
  # تصحيح دوال تتبع الأداء

  1. تحديث الدوال
    - تصحيح اسم الجدول من admin_activity_log إلى admin_activity_logs
    - تصحيح أسماء الأعمدة
*/

-- دالة تحديث الأداء من سجل النشاطات
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
    COUNT(*) FILTER (WHERE resource_type = 'users') as users_managed,
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

-- دالة حساب متوسط وقت الاستجابة (محدثة)
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
