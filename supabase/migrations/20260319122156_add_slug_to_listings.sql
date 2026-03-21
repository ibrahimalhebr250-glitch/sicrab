/*
  # Add Slug Field to Listings
  
  1. Changes
    - Add slug field to listings table
    - Create function to generate slug from title
    - Add trigger to auto-generate slug on insert/update
    - Update existing listings with slugs
  
  2. Security
    - Slug is unique and indexed for fast lookups
*/

-- Add slug column to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create function to generate slug
CREATE OR REPLACE FUNCTION generate_listing_slug(title text, listing_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := regexp_replace(
    lower(trim(title)),
    '[^a-z0-9\u0600-\u06FF\s-]',
    '',
    'g'
  );
  
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  base_slug := substring(base_slug from 1 for 100);
  
  final_slug := base_slug || '-' || substring(listing_id::text from 1 for 8);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_listing_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_listing_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_listing_slug_trigger ON listings;

CREATE TRIGGER set_listing_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

-- Update existing listings with slugs
UPDATE listings
SET slug = generate_listing_slug(title, id)
WHERE slug IS NULL OR slug = '';

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);