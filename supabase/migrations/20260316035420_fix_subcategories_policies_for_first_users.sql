/*
  # Fix Subcategories Policies for First Users

  1. Changes
    - Drop existing admin policies for subcategories
    - Recreate policies to allow first authenticated users to manage subcategories
    - If no admins exist, any authenticated user can manage subcategories
    - Once admins exist, only admins can manage subcategories

  2. Security
    - Maintains RLS protection
    - Allows bootstrapping by first users
    - Transitions to admin-only once admins are established
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;

-- Recreate policies with first-user support
CREATE POLICY "Admins can insert subcategories"
  ON subcategories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update subcategories"
  ON subcategories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
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
    OR NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete subcategories"
  ON subcategories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.is_admin = true
    )
  );