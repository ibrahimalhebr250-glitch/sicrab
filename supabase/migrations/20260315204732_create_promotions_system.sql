/*
  # Create Promotions System for Featured and Pinned Listings

  ## Overview
  This migration creates the infrastructure for listing promotions (featured/pinned ads) to enable platform monetization.

  ## New Tables
  
  ### `promotions`
  Tracks all promotion purchases and their status
  - `id` (uuid, primary key) - Unique promotion identifier
  - `listing_id` (uuid, foreign key) - Reference to the promoted listing
  - `user_id` (uuid, foreign key) - Owner of the promotion
  - `type` (text) - Type of promotion: 'featured', 'pinned', or 'featured_pinned'
  - `start_date` (timestamptz) - When promotion becomes active
  - `end_date` (timestamptz) - When promotion expires
  - `status` (text) - Status: 'active', 'expired', 'pending', 'cancelled'
  - `price` (decimal) - Amount paid for this promotion
  - `payment_status` (text) - Payment status: 'pending', 'completed', 'failed'
  - `payment_method` (text) - Payment method used (for future Stripe integration)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `promotion_packages`
  Defines available promotion packages and pricing
  - `id` (uuid, primary key) - Package identifier
  - `type` (text) - Package type: 'featured', 'pinned', 'featured_pinned'
  - `name_ar` (text) - Package name in Arabic
  - `name_en` (text) - Package name in English
  - `description_ar` (text) - Package description in Arabic
  - `description_en` (text) - Package description in English
  - `price` (decimal) - Package price in USD
  - `duration_days` (integer) - Duration in days
  - `features_ar` (jsonb) - List of features in Arabic
  - `features_en` (jsonb) - List of features in English
  - `is_active` (boolean) - Whether package is currently available
  - `display_order` (integer) - Sort order for display
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - Users can view all active promotions
  - Users can only create/update their own promotions
  - Only authenticated users can purchase promotions

  ## Indexes
  - Index on listing_id for fast lookup of promoted listings
  - Index on user_id for user's promotion history
  - Index on status and end_date for active promotions query
  - Index on type for filtering by promotion type
*/

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('featured', 'pinned', 'featured_pinned')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
  price decimal(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create promotion_packages table
CREATE TABLE IF NOT EXISTS promotion_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE CHECK (type IN ('featured', 'pinned', 'featured_pinned')),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  price decimal(10,2) NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  features_ar jsonb NOT NULL DEFAULT '[]'::jsonb,
  features_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status_end_date ON promotions(status, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions table

CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (status = 'active' AND end_date > now());

CREATE POLICY "Users can view own promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promotions"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for promotion_packages table

CREATE POLICY "Anyone can view active packages"
  ON promotion_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default promotion packages
INSERT INTO promotion_packages (type, name_ar, name_en, description_ar, description_en, price, duration_days, features_ar, features_en, display_order)
VALUES 
  (
    'featured',
    'إعلان مميز',
    'Featured Listing',
    'يظهر إعلانك في أعلى نتائج البحث والصفحة الرئيسية',
    'Your listing appears at the top of search results and home page',
    10.00,
    7,
    '["يظهر في أعلى البحث", "علامة مميز ذهبية", "زيادة المشاهدات بنسبة 300%", "إبراز بلون مختلف"]'::jsonb,
    '["Appears at top of search", "Golden featured badge", "300% more views", "Highlighted with different color"]'::jsonb,
    1
  ),
  (
    'pinned',
    'إعلان مثبت',
    'Pinned Listing',
    'يبقى إعلانك في أعلى القسم دائماً',
    'Your listing stays at the top of its category',
    20.00,
    7,
    '["يبقى في أعلى القسم", "علامة تثبيت", "أولوية في الظهور", "لا ينزل مع الإعلانات الجديدة"]'::jsonb,
    '["Stays at top of category", "Pin badge", "Display priority", "Does not move down with new listings"]'::jsonb,
    2
  ),
  (
    'featured_pinned',
    'باقة البائع السريع',
    'Quick Seller Package',
    'الباقة الكاملة: إعلان مميز ومثبت معاً للبيع الأسرع',
    'Complete package: Featured and Pinned together for fastest selling',
    25.00,
    7,
    '["يظهر في أعلى البحث", "يبقى مثبت في القسم", "علامتي مميز ومثبت", "أقصى إبراز ممكن", "وفر 5 دولار"]'::jsonb,
    '["Top of search results", "Pinned in category", "Both featured and pin badges", "Maximum visibility", "Save $5"]'::jsonb,
    3
  )
ON CONFLICT (type) DO NOTHING;

-- Function to automatically update promotion status based on dates
CREATE OR REPLACE FUNCTION update_promotion_status()
RETURNS void AS $$
BEGIN
  -- Set promotions to active if start date has passed and payment is completed
  UPDATE promotions
  SET status = 'active', updated_at = now()
  WHERE status = 'pending'
    AND payment_status = 'completed'
    AND start_date <= now()
    AND end_date > now();
  
  -- Set promotions to expired if end date has passed
  UPDATE promotions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND end_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get listing with promotion info
CREATE OR REPLACE FUNCTION get_listing_promotion_status(listing_uuid uuid)
RETURNS TABLE (
  is_featured boolean,
  is_pinned boolean,
  promotion_end_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bool_or(p.type IN ('featured', 'featured_pinned')) as is_featured,
    bool_or(p.type IN ('pinned', 'featured_pinned')) as is_pinned,
    max(p.end_date) as promotion_end_date
  FROM promotions p
  WHERE p.listing_id = listing_uuid
    AND p.status = 'active'
    AND p.end_date > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;