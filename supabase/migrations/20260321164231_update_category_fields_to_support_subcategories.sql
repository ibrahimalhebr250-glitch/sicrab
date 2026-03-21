/*
  # Update Category Fields to Support Subcategories

  1. Changes
    - Add `use_subcategories` boolean field to category_fields table
    - When this field is true, the field will automatically populate its options from the subcategories table
    - This replaces the need for manual field_options for subcategory-type fields

  2. Notes
    - If use_subcategories is true, field_options will be ignored
    - Options will be dynamically loaded from subcategories table based on category_id
    - This ensures subcategories defined in admin panel automatically appear in listing forms
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'category_fields' AND column_name = 'use_subcategories'
  ) THEN
    ALTER TABLE category_fields ADD COLUMN use_subcategories boolean DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN category_fields.use_subcategories IS 'When true, field options are automatically populated from subcategories table';
