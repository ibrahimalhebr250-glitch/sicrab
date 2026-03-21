/*
  # Add Slug Fields for SEO-Friendly URLs

  ## Overview
  This migration adds slug fields to categories and cities tables for SEO-friendly URLs and better growth/discovery.

  ## Changes
  
  ### `categories` table
  - Add `slug` field (text, unique) - URL-friendly identifier for categories
  - Add `description_ar` field (text) - Arabic description for SEO
  
  ### `cities` table
  - Add `slug` field (text, unique) - URL-friendly identifier for cities
  
  ## Data Migration
  - Generate slugs from existing English names
  - Convert to lowercase and replace spaces with hyphens

  ## Notes
  - Slugs are used for category pages like /category/scrap
  - Slugs are used for city pages like /city/riyadh
*/

-- Add slug to categories if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug text;
  END IF;
END $$;

-- Add description_ar to categories if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE categories ADD COLUMN description_ar text;
  END IF;
END $$;

-- Add slug to cities if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cities' AND column_name = 'slug'
  ) THEN
    ALTER TABLE cities ADD COLUMN slug text;
  END IF;
END $$;

-- Update category slugs from name_en
UPDATE categories
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', '-'), '&', 'and'), ',', ''))
WHERE slug IS NULL;

-- Update city slugs from name_en
UPDATE cities
SET slug = LOWER(REPLACE(name_en, ' ', '-'))
WHERE slug IS NULL;

-- Add unique constraint to slugs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cities_slug_key'
  ) THEN
    ALTER TABLE cities ADD CONSTRAINT cities_slug_key UNIQUE (slug);
  END IF;
END $$;
