/*
  # Fix platform_bank_account RLS policies

  ## Problem
  1. Admins (authenticated users) have no INSERT/UPDATE policy on platform_bank_account
  2. Profile page only fetches bank account with is_active = true filter

  ## Changes
  - Drop the broken "Anon can manage" policy
  - Add proper INSERT and UPDATE policies for authenticated users (admins/staff)
  - Keep SELECT policies for reading but remove the is_active restriction so profile can always read
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anon can manage bank account" ON platform_bank_account;
DROP POLICY IF EXISTS "Anyone can read active bank account" ON platform_bank_account;
DROP POLICY IF EXISTS "Authenticated can read active bank account" ON platform_bank_account;

-- Allow anyone (anon + authenticated) to read bank account info
CREATE POLICY "Anyone can read bank account"
  ON platform_bank_account
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can read bank account"
  ON platform_bank_account
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admins) to insert bank accounts
CREATE POLICY "Authenticated can insert bank account"
  ON platform_bank_account
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users (admins) to update bank accounts
CREATE POLICY "Authenticated can update bank account"
  ON platform_bank_account
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admins) to delete bank accounts
CREATE POLICY "Authenticated can delete bank account"
  ON platform_bank_account
  FOR DELETE
  TO authenticated
  USING (true);
