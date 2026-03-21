/*
  # Add Terms Acceptance Tracking

  ## Overview
  This migration adds fields to track user acceptance of terms of service and commission agreement.

  ## Changes

  ### Modified Tables

  #### `profiles`
  - Add `accepted_terms` (boolean) - Tracks if user accepted terms of service
  - Add `accepted_commission` (boolean) - Tracks if user accepted commission agreement
  - Add `terms_accepted_at` (timestamptz) - Timestamp of when terms were accepted

  ## Important Notes
  1. All new users must accept both terms and commission agreement
  2. Existing users will have these fields set to true by default
  3. Timestamps help track when users accepted the terms
*/

-- Add terms acceptance fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_terms') THEN
    ALTER TABLE profiles ADD COLUMN accepted_terms boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accepted_commission') THEN
    ALTER TABLE profiles ADD COLUMN accepted_commission boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at') THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at timestamptz DEFAULT now();
  END IF;
END $$;