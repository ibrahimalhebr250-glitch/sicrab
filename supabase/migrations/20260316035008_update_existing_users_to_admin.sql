/*
  # Update Existing Users to Admin

  1. Changes
    - Make all existing users admins
    - This ensures at least one admin exists in the system
  
  2. Security
    - One-time update for existing users
    - Future users will follow the first-user-admin trigger
*/

-- Update all existing users to admin
UPDATE profiles 
SET 
  is_admin = true,
  role = 'admin'
WHERE is_admin = false OR is_admin IS NULL;
