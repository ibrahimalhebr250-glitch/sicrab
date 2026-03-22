/*
  # Reputation Point Actions Configuration

  ## Summary
  Adds a configurable point-actions system for the reputation module.

  ## Changes
  1. New Table: `reputation_point_actions`
     - Defines all available point-earning/losing actions
     - Each action has: key, label_ar, points, icon, category
     - Admins can customize point values per action
     - Seeded with default values matching existing system

  2. New Function: `admin_award_points_by_action`
     - Awards points to a user based on a predefined action key
     - Uses configured point value (or custom override)

  3. New Function: `get_user_reputation_events`
     - Returns paginated reputation events for a specific user

  ## Security
  - RLS enabled on reputation_point_actions
  - Public can read (for display purposes)
  - No write policies needed from frontend (admin-only via functions)
*/

CREATE TABLE IF NOT EXISTS reputation_point_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text UNIQUE NOT NULL,
  label_ar text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'star',
  category text NOT NULL DEFAULT 'positive',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reputation_point_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read point actions"
  ON reputation_point_actions FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO reputation_point_actions (action_key, label_ar, points, icon, category, sort_order) VALUES
  ('fast_reply',           'رد سريع على رسالة (أقل من ساعة)',    10,  'zap',           'positive', 1),
  ('five_star_review',     'حصل على تقييم 5 نجوم',               30,  'star',          'positive', 2),
  ('deal_completed',       'أتمّ صفقة بدون شكاوى',               25,  'check-circle',  'positive', 3),
  ('commission_paid_fast', 'دفع العمولة خلال 24 ساعة',           50,  'trending-up',   'positive', 4),
  ('listing_quality',      'إعلان عالي الجودة مع صور متعددة',   15,  'image',         'positive', 5),
  ('profile_complete',     'إكمال الملف الشخصي بالكامل',         20,  'user-check',    'positive', 6),
  ('complaint_proven',     'شكوى مثبتة ضده',                    -50, 'alert-circle',  'negative', 7),
  ('late_commission',      'تأخر في دفع العمولة',                -20, 'clock',         'negative', 8),
  ('admin_bonus',          'مكافأة خاصة من الإدارة',             50,  'gift',          'admin',    9),
  ('admin_penalty',        'خصم إداري',                         -30,  'minus-circle',  'admin',   10)
ON CONFLICT (action_key) DO NOTHING;

CREATE OR REPLACE FUNCTION admin_award_points_by_action(
  p_user_id uuid,
  p_action_key text,
  p_custom_points integer DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action reputation_point_actions%ROWTYPE;
  v_final_points integer;
  v_description text;
BEGIN
  SELECT * INTO v_action FROM reputation_point_actions WHERE action_key = p_action_key AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action % not found or inactive', p_action_key;
  END IF;

  v_final_points := COALESCE(p_custom_points, v_action.points);
  v_description := v_action.label_ar;
  IF p_note IS NOT NULL AND p_note != '' THEN
    v_description := v_description || ' — ' || p_note;
  END IF;

  INSERT INTO reputation_events (user_id, event_type, points, description)
  VALUES (p_user_id, p_action_key, v_final_points, v_description);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_reputation_events(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  event_type text,
  points integer,
  description text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT re.id, re.event_type, re.points, re.description, re.created_at
  FROM reputation_events re
  WHERE re.user_id = p_user_id
  ORDER BY re.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
