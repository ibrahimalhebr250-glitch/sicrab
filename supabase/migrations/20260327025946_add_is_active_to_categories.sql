/*
  # Add is_active column to categories table

  1. Changes
    - Add `is_active` boolean column to `categories` table with default true
    - Update existing rows to have is_active = true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

UPDATE categories SET is_active = true WHERE is_active IS NULL;
