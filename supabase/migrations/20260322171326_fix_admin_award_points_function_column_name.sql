/*
  # Fix admin_award_points_by_action function

  ## Problem
  The function inserts into `reputation_events` using column name `description`
  but the actual column is `description_ar`.

  ## Changes
  - Fix INSERT statement to use `description_ar` instead of `description`
  - Add new function `admin_award_points_by_actions` (plural) that accepts
    an array of action_keys to support granting multiple action types at once
*/

CREATE OR REPLACE FUNCTION public.admin_award_points_by_action(
  p_user_id uuid,
  p_action_key text,
  p_custom_points integer DEFAULT NULL::integer,
  p_note text DEFAULT NULL::text
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
  SELECT * INTO v_action
  FROM reputation_point_actions
  WHERE action_key = p_action_key AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action % not found or inactive', p_action_key;
  END IF;

  v_final_points := COALESCE(p_custom_points, v_action.points);
  v_description := v_action.label_ar;

  IF p_note IS NOT NULL AND p_note != '' THEN
    v_description := v_description || ' — ' || p_note;
  END IF;

  INSERT INTO reputation_events (user_id, event_type, points, description_ar)
  VALUES (p_user_id, p_action_key, v_final_points, v_description);

  UPDATE profiles
  SET reputation_score = COALESCE(reputation_score, 0) + v_final_points
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_award_points_by_actions(
  p_user_id uuid,
  p_action_keys text[],
  p_note text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action reputation_point_actions%ROWTYPE;
  v_description text;
BEGIN
  FOREACH v_action.action_key IN ARRAY p_action_keys
  LOOP
    SELECT * INTO v_action
    FROM reputation_point_actions
    WHERE action_key = v_action.action_key AND is_active = true;

    IF FOUND THEN
      v_description := v_action.label_ar;
      IF p_note IS NOT NULL AND p_note != '' THEN
        v_description := v_description || ' — ' || p_note;
      END IF;

      INSERT INTO reputation_events (user_id, event_type, points, description_ar)
      VALUES (p_user_id, v_action.action_key, v_action.points, v_description);

      UPDATE profiles
      SET reputation_score = COALESCE(reputation_score, 0) + v_action.points
      WHERE id = p_user_id;
    END IF;
  END LOOP;
END;
$$;
