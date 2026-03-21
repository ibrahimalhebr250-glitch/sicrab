/*
  # نظام الصلاحيات المتقدم

  1. جدول جديد
    - `staff_permissions` - صلاحيات تفصيلية لكل موظف
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key to admin_staff)
      - `section` (text) - اسم القسم (categories, listings, users, reports, etc.)
      - `can_view` (boolean) - صلاحية المشاهدة
      - `can_create` (boolean) - صلاحية الإنشاء
      - `can_edit` (boolean) - صلاحية التعديل
      - `can_delete` (boolean) - صلاحية الحذف
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على الجدول الجديد
    - سياسة للمشرفين لقراءة وإدارة الصلاحيات

  3. ملاحظات
    - يتم ربط الصلاحيات بكل موظف بشكل تفصيلي
    - كل قسم له صلاحيات منفصلة (مشاهدة، إنشاء، تعديل، حذف)
    - المدير العام (super_admin) له كل الصلاحيات تلقائياً
*/

-- إنشاء جدول الصلاحيات التفصيلية
CREATE TABLE IF NOT EXISTS staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES admin_staff(id) ON DELETE CASCADE,
  section text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, section)
);

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON staff_permissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_section ON staff_permissions(section);

-- تفعيل RLS
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- سياسة للمشرفين لقراءة الصلاحيات
CREATE POLICY "Admins can view all permissions"
  ON staff_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE admin_staff.id::text = auth.uid()::text
      AND admin_staff.is_active = true
    )
  );

-- سياسة للمديرين العامين فقط لإدارة الصلاحيات
CREATE POLICY "Super admins can manage permissions"
  ON staff_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_staff
      WHERE admin_staff.id::text = auth.uid()::text
      AND admin_staff.role = 'super_admin'
      AND admin_staff.is_active = true
    )
  );

-- دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION check_staff_permission(
  p_staff_id uuid,
  p_section text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_role text;
  v_has_permission boolean;
BEGIN
  -- التحقق من دور الموظف
  SELECT role INTO v_staff_role
  FROM admin_staff
  WHERE id = p_staff_id AND is_active = true;

  -- المدير العام له كل الصلاحيات
  IF v_staff_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- التحقق من الصلاحية المحددة
  SELECT 
    CASE p_action
      WHEN 'view' THEN can_view
      WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      ELSE false
    END
  INTO v_has_permission
  FROM staff_permissions
  WHERE staff_id = p_staff_id
  AND section = p_section;

  RETURN COALESCE(v_has_permission, false);
END;
$$;

-- دالة للحصول على جميع الأقسام المسموحة لموظف
CREATE OR REPLACE FUNCTION get_staff_allowed_sections(p_staff_id uuid)
RETURNS TABLE(section text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_role text;
BEGIN
  -- التحقق من دور الموظف
  SELECT role INTO v_staff_role
  FROM admin_staff
  WHERE id = p_staff_id AND is_active = true;

  -- المدير العام له كل الأقسام
  IF v_staff_role = 'super_admin' THEN
    RETURN QUERY
    SELECT unnest(ARRAY[
      'dashboard', 'categories', 'listings', 'users', 
      'reports', 'promotions', 'analytics', 'staff',
      'settings', 'activity', 'live_activity', 'commission', 'cities'
    ])::text;
  ELSE
    -- إرجاع الأقسام التي لديه صلاحية مشاهدتها على الأقل
    RETURN QUERY
    SELECT sp.section
    FROM staff_permissions sp
    WHERE sp.staff_id = p_staff_id
    AND sp.can_view = true;
  END IF;
END;
$$;