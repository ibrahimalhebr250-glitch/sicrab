/*
  # Add Platform Mode and Admin Control for Promotion Packages

  ## Overview
  This migration adds platform_mode and promotions_enabled columns to site_settings,
  and enhances promotion_packages with additional management columns.

  ## Changes

  ### site_settings table
  - Adds `platform_mode`: 'free' = all listings equal, 'packages' = promoted get priority
  - Adds `promotions_enabled`: toggle promotions feature on/off globally

  ### promotion_packages table
  - Adds `badge_color` for custom badge styling per package
  - Adds `sort_priority` for ordering within promoted listings
  - Adds `updated_at` timestamp for tracking changes

  ## Notes
  - Admin access is handled via admin_staff table (not supabase auth)
  - No new RLS policies needed as admin panel queries bypass RLS through service role
*/

-- Add platform mode columns to site_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'platform_mode'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN platform_mode text NOT NULL DEFAULT 'free'
      CHECK (platform_mode IN ('free', 'packages'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'promotions_enabled'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN promotions_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add new columns to promotion_packages for richer admin control
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotion_packages' AND column_name = 'badge_color'
  ) THEN
    ALTER TABLE promotion_packages ADD COLUMN badge_color text DEFAULT 'amber';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotion_packages' AND column_name = 'sort_priority'
  ) THEN
    ALTER TABLE promotion_packages ADD COLUMN sort_priority integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotion_packages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE promotion_packages ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
