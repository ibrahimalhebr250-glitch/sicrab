/*
  # Fix Categories and Subcategories RLS Policies Completely

  1. Problem
    - Users without profiles cannot manage categories/subcategories
    - First-time users need ability to bootstrap the system
    - Current policies are too restrictive

  2. Solution
    - Simplify policies to check if any admin exists
    - If no admins exist, allow any authenticated user
    - If admins exist, only admins can manage
    - This allows first users to set up the system

  3. Security
    - Still maintains RLS protection
    - Authenticated users only
    - Transitions to admin-only once system is set up
*/

-- Drop all existing policies for categories
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Drop all existing policies for subcategories
DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;

-- Create new simplified policies for categories
CREATE POLICY "Authenticated users can insert categories when no admins exist"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    -- OR if no admins exist at all (bootstrapping)
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can update categories when no admins exist"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can delete categories when no admins exist"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

-- Create new simplified policies for subcategories
CREATE POLICY "Authenticated users can insert subcategories when no admins exist"
  ON subcategories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can update subcategories when no admins exist"
  ON subcategories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can delete subcategories when no admins exist"
  ON subcategories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );