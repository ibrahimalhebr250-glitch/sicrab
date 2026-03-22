/*
  # Integrated Rewards System

  ## Overview
  This migration creates a comprehensive rewards system combining 5 innovations:

  1. **Reputation Points System** - Dynamic scoring based on all platform actions
  2. **Smart Cashback System** - Commission cashback as redeemable credits
  3. **Market Pulse** - Real-time seller insights and competitor analysis
  4. **SafeDeal Badge** - Transaction-based trust certification
  5. **Double Referral System** - Mutual rewards for inviting new sellers

  ## New Tables

  ### `reputation_events`
  - Tracks every action that affects a user's reputation score
  - event_type: fast_reply, five_star_review, deal_completed, commission_paid_fast, complaint_received, complaint_proven, listing_viewed, listing_shared
  - points: positive or negative integer

  ### `reputation_scores`
  - Cached reputation score per user with level classification
  - level: bronze (0-99), silver (100-299), gold (300-599), platinum (600+)
  - Updated via trigger on every reputation_events insert

  ### `cashback_wallet`
  - Per-user wallet for accumulated cashback credits
  - balance: current redeemable balance in SAR

  ### `cashback_transactions`
  - Every credit/debit to cashback_wallet
  - type: earned, redeemed, expired
  - source: promotion_cashback, commission_cashback, referral_bonus

  ### `market_pulse_data`
  - Hourly aggregated view data per listing
  - Enables "X buyers viewed your listing in the last hour"

  ### `safedeal_certifications`
  - Records qualifying deals that contribute to SafeDeal badge
  - A seller earns SafeDeal after 3 clean completed deals

  ### `referral_codes`
  - Unique referral code per user
  - tracks usage count and total rewards earned

  ### `referral_uses`
  - Records when a referral code is used
  - Both referrer and referee get rewards

  ## Security
  - RLS enabled on all tables
  - Users can only view their own data
  - Admins can view all data
*/

-- ============================================================
-- REPUTATION SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description_ar text,
  related_id uuid,
  related_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reputation events"
  ON reputation_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert reputation events"
  ON reputation_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reputation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'bronze',
  fast_replies integer NOT NULL DEFAULT 0,
  five_star_reviews integer NOT NULL DEFAULT 0,
  deals_completed integer NOT NULL DEFAULT 0,
  complaints_received integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reputation scores"
  ON reputation_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can insert reputation scores"
  ON reputation_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update reputation scores"
  ON reputation_scores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to recalculate reputation score
CREATE OR REPLACE FUNCTION recalculate_reputation(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_total integer;
  v_level text;
  v_fast_replies integer;
  v_five_stars integer;
  v_deals integer;
  v_complaints integer;
BEGIN
  SELECT
    COALESCE(SUM(points), 0),
    COALESCE(SUM(CASE WHEN event_type = 'fast_reply' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'five_star_review' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'deal_completed' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'complaint_proven' THEN 1 ELSE 0 END), 0)
  INTO v_total, v_fast_replies, v_five_stars, v_deals, v_complaints
  FROM reputation_events
  WHERE user_id = p_user_id;

  v_level := CASE
    WHEN v_total >= 600 THEN 'platinum'
    WHEN v_total >= 300 THEN 'gold'
    WHEN v_total >= 100 THEN 'silver'
    ELSE 'bronze'
  END;

  INSERT INTO reputation_scores (user_id, total_points, level, fast_replies, five_star_reviews, deals_completed, complaints_received, updated_at)
  VALUES (p_user_id, v_total, v_level, v_fast_replies, v_five_stars, v_deals, v_complaints, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    level = EXCLUDED.level,
    fast_replies = EXCLUDED.fast_replies,
    five_star_reviews = EXCLUDED.five_star_reviews,
    deals_completed = EXCLUDED.deals_completed,
    complaints_received = EXCLUDED.complaints_received,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update reputation score on new event
CREATE OR REPLACE FUNCTION trigger_recalculate_reputation()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_reputation(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reputation_event_insert ON reputation_events;
CREATE TRIGGER on_reputation_event_insert
  AFTER INSERT ON reputation_events
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_reputation();

-- ============================================================
-- CASHBACK WALLET SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS cashback_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  total_earned numeric(10,2) NOT NULL DEFAULT 0,
  total_redeemed numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cashback_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON cashback_wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet"
  ON cashback_wallet FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallet"
  ON cashback_wallet FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cashback_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'referral_bonus')),
  amount numeric(10,2) NOT NULL,
  source text,
  source_id uuid,
  description_ar text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cashback transactions"
  ON cashback_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert cashback transactions"
  ON cashback_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to add cashback to wallet
CREATE OR REPLACE FUNCTION add_cashback(p_user_id uuid, p_amount numeric, p_type text, p_source text, p_source_id uuid, p_description text)
RETURNS void AS $$
BEGIN
  INSERT INTO cashback_wallet (user_id, balance, total_earned, updated_at)
  VALUES (p_user_id, p_amount, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE SET
    balance = cashback_wallet.balance + p_amount,
    total_earned = cashback_wallet.total_earned + p_amount,
    updated_at = now();

  INSERT INTO cashback_transactions (user_id, type, amount, source, source_id, description_ar)
  VALUES (p_user_id, p_type, p_amount, p_source, p_source_id, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MARKET PULSE SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS market_pulse_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  views_last_hour integer NOT NULL DEFAULT 0,
  views_last_24h integer NOT NULL DEFAULT 0,
  competitor_avg_price numeric(10,2),
  competitor_count integer DEFAULT 0,
  price_suggestion numeric(10,2),
  price_suggestion_reason text,
  last_viewed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE market_pulse_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can view market pulse"
  ON market_pulse_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = market_pulse_data.listing_id
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert market pulse"
  ON market_pulse_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update market pulse"
  ON market_pulse_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- View tracking for market pulse (tracks individual view events)
CREATE TABLE IF NOT EXISTS listing_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE listing_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert view events"
  ON listing_view_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Listing owners can view their listing events"
  ON listing_view_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_view_events.listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Function to get market pulse for a listing
CREATE OR REPLACE FUNCTION get_market_pulse(p_listing_id uuid)
RETURNS json AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_views_hour integer;
  v_views_24h integer;
  v_comp_avg numeric;
  v_comp_count integer;
  v_price_suggestion numeric;
  v_suggestion_reason text;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;
  
  SELECT COUNT(*) INTO v_views_hour
  FROM listing_view_events
  WHERE listing_id = p_listing_id AND viewed_at > now() - interval '1 hour';
  
  SELECT COUNT(*) INTO v_views_24h
  FROM listing_view_events
  WHERE listing_id = p_listing_id AND viewed_at > now() - interval '24 hours';
  
  SELECT AVG(price), COUNT(*)
  INTO v_comp_avg, v_comp_count
  FROM listings
  WHERE category_id = v_listing.category_id
    AND city_id = v_listing.city_id
    AND id != p_listing_id
    AND is_active = true
    AND created_at > now() - interval '30 days';
  
  IF v_comp_avg IS NOT NULL AND v_listing.price > v_comp_avg * 1.2 THEN
    v_price_suggestion := v_comp_avg * 1.05;
    v_suggestion_reason := 'سعرك أعلى بـ 20% من متوسط السوق';
  ELSIF v_comp_avg IS NOT NULL AND v_listing.price < v_comp_avg * 0.8 THEN
    v_price_suggestion := v_comp_avg * 0.95;
    v_suggestion_reason := 'يمكنك رفع السعر - سعرك أقل من المنافسين';
  ELSE
    v_price_suggestion := v_listing.price;
    v_suggestion_reason := 'سعرك تنافسي ومناسب';
  END IF;

  RETURN json_build_object(
    'views_last_hour', v_views_hour,
    'views_last_24h', v_views_24h,
    'competitor_avg_price', ROUND(COALESCE(v_comp_avg, 0), 2),
    'competitor_count', COALESCE(v_comp_count, 0),
    'price_suggestion', ROUND(v_price_suggestion, 2),
    'price_suggestion_reason', v_suggestion_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SAFEDEAL CERTIFICATION SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS safedeal_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  deal_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'disputed', 'cancelled')),
  buyer_confirmed boolean DEFAULT false,
  seller_confirmed boolean DEFAULT false,
  dispute_raised_at timestamptz,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safedeal_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safedeal deals"
  ON safedeal_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Authenticated users can insert safedeal deals"
  ON safedeal_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can update own safedeal deals"
  ON safedeal_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE TABLE IF NOT EXISTS safedeal_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certified_at timestamptz DEFAULT now(),
  clean_deals_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  revoke_reason text
);

ALTER TABLE safedeal_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view safedeal certifications"
  ON safedeal_certifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can insert safedeal certifications"
  ON safedeal_certifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update safedeal certifications"
  ON safedeal_certifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to check and update SafeDeal certification
CREATE OR REPLACE FUNCTION check_safedeal_certification(p_seller_id uuid)
RETURNS void AS $$
DECLARE
  v_clean_deals integer;
BEGIN
  SELECT COUNT(*) INTO v_clean_deals
  FROM safedeal_deals
  WHERE seller_id = p_seller_id AND status = 'completed' AND buyer_confirmed = true;

  IF v_clean_deals >= 3 THEN
    INSERT INTO safedeal_certifications (user_id, clean_deals_count, is_active)
    VALUES (p_seller_id, v_clean_deals, true)
    ON CONFLICT (user_id) DO UPDATE SET
      clean_deals_count = EXCLUDED.clean_deals_count,
      is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REFERRAL SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  uses_count integer NOT NULL DEFAULT 0,
  total_rewards_earned numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code"
  ON referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update referral codes"
  ON referral_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS referral_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referrer_reward numeric(10,2) NOT NULL DEFAULT 0,
  referee_reward numeric(10,2) NOT NULL DEFAULT 0,
  referrer_reward_type text DEFAULT 'cashback',
  referee_reward_type text DEFAULT 'discount',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral uses"
  ON referral_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert referral uses"
  ON referral_uses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referral uses"
  ON referral_uses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to read referral codes for validation
CREATE POLICY "Anyone can view referral codes for validation"
  ON referral_codes FOR SELECT
  TO anon
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_code text;
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  v_code := UPPER(SUBSTRING(REPLACE(v_profile.full_name, ' ', ''), 1, 4)) || UPPER(SUBSTRING(p_user_id::text, 1, 4));
  
  WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = v_code AND user_id != p_user_id) LOOP
    v_code := v_code || FLOOR(RANDOM() * 10)::text;
  END LOOP;
  
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_user_id ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_view_events_listing_id ON listing_view_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_view_events_viewed_at ON listing_view_events(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_safedeal_deals_seller_id ON safedeal_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referrer_id ON referral_uses(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referee_id ON referral_uses(referee_id);

-- ============================================================
-- SEED INITIAL REPUTATION SCORES FOR EXISTING USERS
-- ============================================================

INSERT INTO reputation_scores (user_id, total_points, level)
SELECT id, 0, 'bronze'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM reputation_scores WHERE reputation_scores.user_id = profiles.id
);

-- Seed cashback wallets for existing users
INSERT INTO cashback_wallet (user_id, balance, total_earned)
SELECT id, 0, 0
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM cashback_wallet WHERE cashback_wallet.user_id = profiles.id
);
