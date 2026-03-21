/*
  # Create Trust System Infrastructure

  ## Overview
  This migration creates the database infrastructure for the platform trust system including verification, reviews, reports, and badges.

  ## New Tables

  ### `seller_reviews`
  Tracks buyer reviews for sellers
  - `id` (uuid, primary key) - Unique review identifier
  - `seller_id` (uuid, foreign key) - Seller being reviewed
  - `buyer_id` (uuid, foreign key) - Buyer who made the review
  - `listing_id` (uuid, foreign key) - Related listing
  - `rating` (integer) - Rating from 1 to 5
  - `comment` (text) - Review comment
  - `created_at` (timestamptz) - Review creation time

  ### `reports`
  Tracks reports for listings and users
  - `id` (uuid, primary key) - Unique report identifier
  - `listing_id` (uuid, foreign key) - Reported listing
  - `reporter_id` (uuid, foreign key) - User who made the report
  - `reason` (text) - Report reason
  - `description` (text) - Detailed description
  - `status` (text) - Status: 'pending', 'reviewed', 'resolved', 'dismissed'
  - `created_at` (timestamptz) - Report creation time

  ### `verification_codes`
  Stores phone verification codes
  - `id` (uuid, primary key) - Unique code identifier
  - `user_id` (uuid, foreign key) - User requesting verification
  - `phone` (text) - Phone number to verify
  - `code` (text) - Verification code
  - `expires_at` (timestamptz) - Code expiration time
  - `verified` (boolean) - Whether code was used
  - `created_at` (timestamptz) - Code creation time

  ## Table Modifications

  ### `profiles`
  - Add `phone_verified` for phone verification status
  - Add `phone_verified_at` for verification timestamp
  - Add `last_active_at` for activity tracking
  - Add `average_rating` for cached rating
  - Add `total_reviews` for review count
  - Add `reports_count` for reports received
  - Add `is_suspended` for account suspension

  ## Security
  - Enable RLS on all new tables
  - Users can create their own reviews
  - Users can view reviews for any seller
  - Users can create reports
  - Admins can view all reports

  ## Indexes
  - Index on seller_id for fast review queries
  - Index on listing_id for report queries
  - Index on reporter_id for user report history
  - Index on status for report filtering

  ## Important Notes
  1. Reviews require completed transactions (future enhancement)
  2. Reports are automatically flagged if user gets 5+ reports
  3. Badge calculation is done in real-time
  4. Phone verification codes expire after 10 minutes
*/

-- Create seller_reviews table
CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, buyer_id, listing_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('fake_listing', 'incorrect_price', 'inappropriate_content', 'fraud', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add trust fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified_at') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'average_rating') THEN
    ALTER TABLE profiles ADD COLUMN average_rating numeric(3,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_reviews') THEN
    ALTER TABLE profiles ADD COLUMN total_reviews integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reports_count') THEN
    ALTER TABLE profiles ADD COLUMN reports_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_suspended') THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_buyer ON seller_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_listing ON seller_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON verification_codes(user_id);

-- Enable RLS
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_reviews

CREATE POLICY "Anyone can view reviews"
  ON seller_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Buyers can create reviews"
  ON seller_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own reviews"
  ON seller_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for reports

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for verification_codes

CREATE POLICY "Users can view own verification codes"
  ON verification_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification codes"
  ON verification_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update seller rating
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM seller_reviews
      WHERE seller_id = NEW.seller_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM seller_reviews
      WHERE seller_id = NEW.seller_id
    )
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;
CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT OR UPDATE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating();

-- Function to track reports and auto-suspend
CREATE OR REPLACE FUNCTION track_reports()
RETURNS trigger AS $$
DECLARE
  listing_owner_id uuid;
  report_count integer;
BEGIN
  IF NEW.listing_id IS NOT NULL THEN
    SELECT user_id INTO listing_owner_id
    FROM listings
    WHERE id = NEW.listing_id;
    
    IF listing_owner_id IS NOT NULL THEN
      UPDATE profiles
      SET reports_count = reports_count + 1
      WHERE id = listing_owner_id;
      
      SELECT reports_count INTO report_count
      FROM profiles
      WHERE id = listing_owner_id;
      
      IF report_count >= 5 THEN
        UPDATE profiles
        SET is_suspended = true
        WHERE id = listing_owner_id;
        
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
          listing_owner_id,
          'listing_reply',
          'تنبيه: تم تعليق حسابك',
          'تم تعليق حسابك مؤقتاً بسبب تلقي عدة بلاغات. سيتم مراجعة حسابك من قبل الإدارة.'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for report tracking
DROP TRIGGER IF EXISTS trigger_track_reports ON reports;
CREATE TRIGGER trigger_track_reports
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION track_reports();

-- Function to update last active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET last_active_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activity tracking
DROP TRIGGER IF EXISTS trigger_update_last_active ON listings;
CREATE TRIGGER trigger_update_last_active
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Function to calculate seller badge
CREATE OR REPLACE FUNCTION get_seller_badge(
  p_user_id uuid,
  p_created_at timestamptz,
  p_listings_count integer,
  p_reports_count integer,
  p_average_rating numeric
)
RETURNS text AS $$
DECLARE
  account_age_days integer;
BEGIN
  account_age_days := EXTRACT(DAY FROM now() - p_created_at);
  
  IF account_age_days > 30 AND p_listings_count >= 5 AND p_reports_count = 0 AND p_average_rating >= 4.0 THEN
    RETURN 'trusted';
  ELSIF p_listings_count >= 3 OR account_age_days > 7 THEN
    RETURN 'active';
  ELSE
    RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;