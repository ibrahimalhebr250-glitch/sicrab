/*
  # نظام تقييم أداء الموظفين

  1. جداول جديدة
    - `staff_performance_metrics` - إحصائيات أداء الموظفين
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to admin_staff)
      - `date` (date) - التاريخ
      - `listings_reviewed` (integer) - عدد الإعلانات المراجعة
      - `reports_handled` (integer) - عدد البلاغات المعالجة
      - `total_actions` (integer) - إجمالي العمليات
      - `avg_response_time` (integer) - متوسط وقت الاستجابة بالدقائق
      - `created_at` (timestamptz)
      
    - `staff_performance_alerts` - تنبيهات الأداء
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to admin_staff)
      - `alert_type` (text) - نوع التنبيه: inactive, slow_response, high_performer
      - `message` (text) - رسالة التنبيه
      - `severity` (text) - warning, info, success
      - `is_read` (boolean) - هل تم قراءة التنبيه
      - `created_at` (timestamptz)

  2. دوال مساعدة
    - `calculate_staff_rating` - حساب تقييم الموظف
    - `get_staff_performance_summary` - ملخص أداء الموظف
    - `generate_performance_alerts` - توليد التنبيهات التلقائية

  3. الأمان
    - تفعيل RLS على جميع الجداول
    - صلاحيات للمديرين فقط
*/

-- جدول إحصائيات الأداء اليومية
CREATE TABLE IF NOT EXISTS staff_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES admin_staff(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  listings_reviewed integer DEFAULT 0,
  reports_handled integer DEFAULT 0,
  users_managed integer DEFAULT 0,
  categories_modified integer DEFAULT 0,
  total_actions integer DEFAULT 0,
  avg_response_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- جدول تنبيهات الأداء
CREATE TABLE IF NOT EXISTS staff_performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES admin_staff(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('inactive', 'slow_response', 'high_performer', 'low_activity')),
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('warning', 'info', 'success')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_performance_staff_date ON staff_performance_metrics(staff_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_date ON staff_performance_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_staff_unread ON staff_performance_alerts(staff_id, is_read) WHERE is_read = false;

-- دالة حساب التقييم (من 5)
CREATE OR REPLACE FUNCTION calculate_staff_rating(p_staff_id uuid, p_days integer DEFAULT 30)
RETURNS numeric AS $$
DECLARE
  v_total_actions integer;
  v_avg_response_time integer;
  v_active_days integer;
  v_rating numeric;
BEGIN
  SELECT 
    COALESCE(SUM(total_actions), 0),
    COALESCE(AVG(NULLIF(avg_response_time, 0)), 0),
    COUNT(DISTINCT date)
  INTO v_total_actions, v_avg_response_time, v_active_days
  FROM staff_performance_metrics
  WHERE staff_id = p_staff_id
    AND date >= CURRENT_DATE - p_days;
  
  -- حساب التقييم بناءً على عدة عوامل
  v_rating := 0;
  
  -- العمليات (40% من التقييم)
  IF v_total_actions >= 200 THEN
    v_rating := v_rating + 2.0;
  ELSIF v_total_actions >= 100 THEN
    v_rating := v_rating + 1.5;
  ELSIF v_total_actions >= 50 THEN
    v_rating := v_rating + 1.0;
  ELSIF v_total_actions >= 20 THEN
    v_rating := v_rating + 0.5;
  END IF;
  
  -- النشاط (30% من التقييم)
  IF v_active_days >= p_days * 0.8 THEN
    v_rating := v_rating + 1.5;
  ELSIF v_active_days >= p_days * 0.6 THEN
    v_rating := v_rating + 1.0;
  ELSIF v_active_days >= p_days * 0.4 THEN
    v_rating := v_rating + 0.5;
  END IF;
  
  -- سرعة الاستجابة (30% من التقييم)
  IF v_avg_response_time > 0 THEN
    IF v_avg_response_time <= 15 THEN
      v_rating := v_rating + 1.5;
    ELSIF v_avg_response_time <= 30 THEN
      v_rating := v_rating + 1.0;
    ELSIF v_avg_response_time <= 60 THEN
      v_rating := v_rating + 0.5;
    END IF;
  END IF;
  
  RETURN LEAST(v_rating, 5.0);
END;
$$ LANGUAGE plpgsql;

-- دالة الحصول على ملخص الأداء
CREATE OR REPLACE FUNCTION get_staff_performance_summary(p_staff_id uuid, p_days integer DEFAULT 30)
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
  v_rating numeric;
BEGIN
  SELECT 
    COALESCE(SUM(m.total_actions), 0),
    COALESCE(SUM(m.listings_reviewed), 0),
    COALESCE(SUM(m.reports_handled), 0),
    COALESCE(SUM(m.users_managed), 0),
    COALESCE(SUM(m.categories_modified), 0),
    COALESCE(AVG(NULLIF(m.avg_response_time, 0)), 0),
    COUNT(DISTINCT m.date)
  INTO 
    total_actions, listings_reviewed, reports_handled, 
    users_managed, categories_modified, avg_response_time, active_days
  FROM staff_performance_metrics m
  WHERE m.staff_id = p_staff_id
    AND m.date >= CURRENT_DATE - p_days;
  
  v_rating := calculate_staff_rating(p_staff_id, p_days);
  rating := v_rating;
  
  -- تصنيف الأداء
  IF v_rating >= 4.0 THEN
    performance_category := 'excellent';
  ELSIF v_rating >= 3.0 THEN
    performance_category := 'good';
  ELSIF v_rating >= 2.0 THEN
    performance_category := 'average';
  ELSE
    performance_category := 'poor';
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- دالة توليد التنبيهات التلقائية
CREATE OR REPLACE FUNCTION generate_performance_alerts()
RETURNS void AS $$
DECLARE
  v_staff RECORD;
  v_last_activity timestamptz;
  v_avg_response numeric;
  v_total_actions integer;
BEGIN
  FOR v_staff IN 
    SELECT id, email, full_name 
    FROM admin_staff 
    WHERE is_active = true AND role != 'super_admin'
  LOOP
    -- التحقق من النشاط الأخير
    SELECT MAX(date), AVG(avg_response_time), SUM(total_actions)
    INTO v_last_activity, v_avg_response, v_total_actions
    FROM staff_performance_metrics
    WHERE staff_id = v_staff.id
      AND date >= CURRENT_DATE - 7;
    
    -- تنبيه: موظف غير نشط
    IF v_last_activity IS NULL OR v_last_activity < CURRENT_DATE - 3 THEN
      INSERT INTO staff_performance_alerts (staff_id, alert_type, message, severity)
      VALUES (
        v_staff.id,
        'inactive',
        'الموظف ' || v_staff.full_name || ' لم يسجل أي نشاط منذ 3 أيام',
        'warning'
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- تنبيه: موظف بطيء
    IF v_avg_response > 60 AND v_total_actions > 0 THEN
      INSERT INTO staff_performance_alerts (staff_id, alert_type, message, severity)
      VALUES (
        v_staff.id,
        'slow_response',
        'متوسط وقت استجابة الموظف ' || v_staff.full_name || ' بطيء: ' || ROUND(v_avg_response) || ' دقيقة',
        'warning'
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- تنبيه: موظف عالي الأداء
    IF v_total_actions >= 100 AND v_avg_response <= 30 THEN
      INSERT INTO staff_performance_alerts (staff_id, alert_type, message, severity)
      VALUES (
        v_staff.id,
        'high_performer',
        'الموظف ' || v_staff.full_name || ' يحقق أداء ممتاز!',
        'success'
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- تنبيه: نشاط منخفض
    IF v_total_actions > 0 AND v_total_actions < 10 THEN
      INSERT INTO staff_performance_alerts (staff_id, alert_type, message, severity)
      VALUES (
        v_staff.id,
        'low_activity',
        'نشاط الموظف ' || v_staff.full_name || ' منخفض هذا الأسبوع',
        'info'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- تحديث الأداء تلقائياً من سجل النشاطات
CREATE OR REPLACE FUNCTION update_staff_performance_from_activity()
RETURNS void AS $$
BEGIN
  -- تحديث الإحصائيات من سجل النشاطات
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
    performed_by,
    DATE(performed_at) as date,
    COUNT(*) FILTER (WHERE action_type IN ('approve_listing', 'reject_listing', 'edit_listing')) as listings_reviewed,
    COUNT(*) FILTER (WHERE action_type IN ('resolve_report', 'dismiss_report')) as reports_handled,
    COUNT(*) FILTER (WHERE table_name = 'users') as users_managed,
    COUNT(*) FILTER (WHERE table_name IN ('categories', 'subcategories')) as categories_modified,
    COUNT(*) as total_actions,
    now()
  FROM admin_activity_log
  WHERE performed_at >= CURRENT_DATE
    AND performed_by IS NOT NULL
  GROUP BY performed_by, DATE(performed_at)
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

-- تفعيل RLS
ALTER TABLE staff_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance_alerts ENABLE ROW LEVEL SECURITY;

-- صلاحيات للمديرين لقراءة جميع البيانات
CREATE POLICY "Admins can view all performance metrics"
  ON staff_performance_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Admins can insert performance metrics"
  ON staff_performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Admins can update performance metrics"
  ON staff_performance_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

-- صلاحيات التنبيهات
CREATE POLICY "Admins can view all alerts"
  ON staff_performance_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "System can create alerts"
  ON staff_performance_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update alerts"
  ON staff_performance_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON staff_performance_alerts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE id = auth.uid()
        AND is_active = true
    )
  );
