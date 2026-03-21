/*
  # Fix Admin Policies - Allow First Users

  1. Changes
    - Update policies to allow operations if user is admin OR if no admins exist yet
    - This ensures the system can bootstrap itself
  
  2. Security
    - Once an admin exists, only admins can manage categories
    - Until then, any authenticated user can set up the system
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
  DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
  DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;
  DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
  DROP POLICY IF EXISTS "Admins can update categories" ON categories;
  DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
END $$;

-- Subcategories policies - allow if admin OR no admins exist
CREATE POLICY "Admins can insert subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete subcategories"
  ON subcategories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );

-- Categories policies - allow if admin OR no admins exist
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles WHERE is_admin = true
    )
  );
