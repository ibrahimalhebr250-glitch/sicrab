/*
  # إضافة دالة ملخص الأداء

  1. دالة جديدة
    - get_staff_performance_summary: تحسب ملخص أداء الموظف لفترة زمنية
    - تحسب التقييم والأيام النشطة والتصنيف
*/

-- دالة لحساب ملخص أداء الموظف
CREATE OR REPLACE FUNCTION get_staff_performance_summary(
  p_staff_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_actions bigint,
  listings_reviewed bigint,
  reports_handled bigint,
  users_managed bigint,
  categories_modified bigint,
  avg_response_time numeric,
  active_days bigint,
  rating numeric,
  performance_category text
) AS $$
DECLARE
  v_total_actions bigint;
  v_active_days bigint;
  v_avg_response_time numeric;
  v_rating numeric;
  v_performance_category text;
BEGIN
  -- حساب الإحصائيات من جدول staff_performance_metrics
  SELECT 
    COALESCE(SUM(m.total_actions), 0),
    COALESCE(SUM(m.listings_reviewed), 0),
    COALESCE(SUM(m.reports_handled), 0),
    COALESCE(SUM(m.users_managed), 0),
    COALESCE(SUM(m.categories_modified), 0),
    COALESCE(AVG(m.avg_response_time), 0),
    COUNT(DISTINCT m.date)
  INTO
    total_actions,
    listings_reviewed,
    reports_handled,
    users_managed,
    categories_modified,
    avg_response_time,
    v_active_days
  FROM staff_performance_metrics m
  WHERE m.staff_id = p_staff_id
    AND m.date >= CURRENT_DATE - p_days;

  -- تعيين active_days
  active_days := v_active_days;

  -- حساب التقييم (من 5)
  -- العوامل: عدد العمليات (40%)، الأيام النشطة (30%)، سرعة الاستجابة (30%)
  DECLARE
    v_actions_score numeric;
    v_days_score numeric;
    v_response_score numeric;
  BEGIN
    -- نقاط العمليات: كل 10 عمليات = 1 نقطة (حد أقصى 5)
    v_actions_score := LEAST(5, total_actions::numeric / 10.0);
    
    -- نقاط الأيام النشطة: نسبة الأيام النشطة من إجمالي الفترة
    v_days_score := (v_active_days::numeric / p_days::numeric) * 5;
    
    -- نقاط الاستجابة: كلما كان أسرع كان أفضل
    -- أقل من 30 دقيقة = 5، أكثر من 120 دقيقة = 1
    IF avg_response_time = 0 THEN
      v_response_score := 3; -- متوسط إذا لم يكن هناك بيانات
    ELSIF avg_response_time <= 30 THEN
      v_response_score := 5;
    ELSIF avg_response_time <= 60 THEN
      v_response_score := 4;
    ELSIF avg_response_time <= 90 THEN
      v_response_score := 3;
    ELSIF avg_response_time <= 120 THEN
      v_response_score := 2;
    ELSE
      v_response_score := 1;
    END IF;
    
    -- حساب التقييم النهائي
    v_rating := (v_actions_score * 0.4) + (v_days_score * 0.3) + (v_response_score * 0.3);
    v_rating := LEAST(5, GREATEST(0, v_rating)); -- التأكد من أنه بين 0 و 5
  END;

  rating := ROUND(v_rating, 2);

  -- تحديد التصنيف
  IF v_rating >= 4.5 THEN
    v_performance_category := 'excellent';
  ELSIF v_rating >= 3.5 THEN
    v_performance_category := 'good';
  ELSIF v_rating >= 2.5 THEN
    v_performance_category := 'average';
  ELSE
    v_performance_category := 'poor';
  END IF;

  performance_category := v_performance_category;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
