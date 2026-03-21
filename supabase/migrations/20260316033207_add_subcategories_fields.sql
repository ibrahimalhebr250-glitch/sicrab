/*
  # Add missing fields to subcategories table

  1. Changes
    - Add `slug` column to subcategories (text, unique, nullable)
    - Add `is_active` column to subcategories (boolean, default true)
    - Add `description_ar` column to subcategories (text, nullable)

  2. Purpose
    These fields are needed for:
    - SEO-friendly URLs (slug)
    - Ability to activate/deactivate subcategories (is_active)
    - Arabic descriptions for subcategories (description_ar)
*/

-- Add slug column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN slug text UNIQUE;
  END IF;
END $$;

-- Add is_active column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add description_ar column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN description_ar text;
  END IF;
END $$;

-- Set existing subcategories to active
UPDATE subcategories SET is_active = true WHERE is_active IS NULL;
