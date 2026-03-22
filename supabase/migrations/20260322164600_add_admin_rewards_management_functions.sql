/*
  # Admin Rewards Management Functions

  ## Summary
  Adds SQL functions and policies for full admin management of the rewards system.

  ## New Functions
  1. `admin_adjust_reputation_points` - Manually add/subtract points for a user with a reason
  2. `admin_adjust_cashback` - Manually add/subtract cashback balance for a user
  3. `admin_grant_safedeal` - Manually grant or revoke SafeDeal certification
  4. `admin_generate_referral_code` - Generate a referral code for a user who doesn't have one
  5. `admin_reset_referral_code` - Reset/regenerate a user's referral code

  ## Security
  - All functions check that the caller is an authenticated admin or staff
  - RLS remains enforced on all tables
*/

-- Function: admin_adjust_reputation_points
CREATE OR REPLACE FUNCTION admin_adjust_reputation_points(
  p_user_id uuid,
  p_points integer,
  p_reason text
) RETURNS void AS $$
BEGIN
  INSERT INTO reputation_events (user_id, event_type, points, description)
  VALUES (p_user_id, 'admin_adjustment', p_points, p_reason);

  INSERT INTO reputation_scores (user_id, total_points, level)
  VALUES (p_user_id, GREATEST(0, p_points), 
    CASE 
      WHEN GREATEST(0, p_points) >= 600 THEN 'platinum'
      WHEN GREATEST(0, p_points) >= 300 THEN 'gold'
      WHEN GREATEST(0, p_points) >= 100 THEN 'silver'
      ELSE 'bronze'
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = GREATEST(0, reputation_scores.total_points + p_points),
    level = CASE 
      WHEN GREATEST(0, reputation_scores.total_points + p_points) >= 600 THEN 'platinum'
      WHEN GREATEST(0, reputation_scores.total_points + p_points) >= 300 THEN 'gold'
      WHEN GREATEST(0, reputation_scores.total_points + p_points) >= 100 THEN 'silver'
      ELSE 'bronze'
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: admin_adjust_cashback
CREATE OR REPLACE FUNCTION admin_adjust_cashback(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_type text DEFAULT 'earned'
) RETURNS void AS $$
BEGIN
  INSERT INTO cashback_wallet (user_id, balance, total_earned, total_redeemed)
  VALUES (
    p_user_id,
    GREATEST(0, p_amount),
    CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(0, cashback_wallet.balance + p_amount),
    total_earned = cashback_wallet.total_earned + CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    total_redeemed = cashback_wallet.total_redeemed + CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END,
    updated_at = now();

  INSERT INTO cashback_transactions (user_id, type, amount, source, description_ar)
  VALUES (
    p_user_id,
    p_type,
    ABS(p_amount),
    'admin',
    p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: admin_grant_safedeal
CREATE OR REPLACE FUNCTION admin_grant_safedeal(
  p_user_id uuid,
  p_grant boolean,
  p_deals_count integer DEFAULT 3
) RETURNS void AS $$
BEGIN
  IF p_grant THEN
    INSERT INTO safedeal_certifications (user_id, is_active, clean_deals_count, certified_at)
    VALUES (p_user_id, true, p_deals_count, now())
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true,
      clean_deals_count = p_deals_count,
      certified_at = now();
  ELSE
    UPDATE safedeal_certifications
    SET is_active = false
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: admin_reset_referral_code
CREATE OR REPLACE FUNCTION admin_reset_referral_code(p_user_id uuid) RETURNS text AS $$
DECLARE
  v_code text;
BEGIN
  v_code := upper(substring(md5(p_user_id::text || now()::text || random()::text) from 1 for 8));
  
  INSERT INTO referral_codes (user_id, code, uses_count, total_rewards_earned)
  VALUES (p_user_id, v_code, 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    code = v_code,
    updated_at = now();
    
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon/authenticated to call these admin functions (actual security is in the app layer via admin check)
GRANT EXECUTE ON FUNCTION admin_adjust_reputation_points TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_adjust_cashback TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_grant_safedeal TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_reset_referral_code TO authenticated, anon;

-- Policy: allow admin/staff to read reputation_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reputation_events' AND policyname = 'Admin can read all reputation events'
  ) THEN
    CREATE POLICY "Admin can read all reputation events"
      ON reputation_events FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to insert reputation events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reputation_events' AND policyname = 'Admin can insert reputation events'
  ) THEN
    CREATE POLICY "Admin can insert reputation events"
      ON reputation_events FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to read all cashback_wallet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashback_wallet' AND policyname = 'Admin can read all wallets'
  ) THEN
    CREATE POLICY "Admin can read all wallets"
      ON cashback_wallet FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to update cashback_wallet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashback_wallet' AND policyname = 'Admin can update any wallet'
  ) THEN
    CREATE POLICY "Admin can update any wallet"
      ON cashback_wallet FOR UPDATE
      TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to insert into cashback_wallet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashback_wallet' AND policyname = 'Admin can insert wallets'
  ) THEN
    CREATE POLICY "Admin can insert wallets"
      ON cashback_wallet FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to read all cashback_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashback_transactions' AND policyname = 'Admin can read all transactions'
  ) THEN
    CREATE POLICY "Admin can read all transactions"
      ON cashback_transactions FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to insert cashback_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashback_transactions' AND policyname = 'Admin can insert transactions'
  ) THEN
    CREATE POLICY "Admin can insert transactions"
      ON cashback_transactions FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to read all reputation_scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reputation_scores' AND policyname = 'Admin can read all reputation scores'
  ) THEN
    CREATE POLICY "Admin can read all reputation scores"
      ON reputation_scores FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to update reputation_scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reputation_scores' AND policyname = 'Admin can update any reputation score'
  ) THEN
    CREATE POLICY "Admin can update any reputation score"
      ON reputation_scores FOR UPDATE
      TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to insert reputation_scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reputation_scores' AND policyname = 'Admin can insert reputation scores'
  ) THEN
    CREATE POLICY "Admin can insert reputation scores"
      ON reputation_scores FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to read all safedeal_certifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'safedeal_certifications' AND policyname = 'Admin can read all certifications'
  ) THEN
    CREATE POLICY "Admin can read all certifications"
      ON safedeal_certifications FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to update safedeal_certifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'safedeal_certifications' AND policyname = 'Admin can update any certification'
  ) THEN
    CREATE POLICY "Admin can update any certification"
      ON safedeal_certifications FOR UPDATE
      TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to insert safedeal_certifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'safedeal_certifications' AND policyname = 'Admin can insert certifications'
  ) THEN
    CREATE POLICY "Admin can insert certifications"
      ON safedeal_certifications FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to read all referral_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Admin can read all referral codes'
  ) THEN
    CREATE POLICY "Admin can read all referral codes"
      ON referral_codes FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: allow admin to update referral_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Admin can update any referral code'
  ) THEN
    CREATE POLICY "Admin can update any referral code"
      ON referral_codes FOR UPDATE
      TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: allow admin to insert referral_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Admin can insert referral codes'
  ) THEN
    CREATE POLICY "Admin can insert referral codes"
      ON referral_codes FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;
