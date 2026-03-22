/*
  # Add whatsapp_number to profiles

  1. Changes
    - Adds `whatsapp_number` (text, nullable) column to the `profiles` table
    - This allows users to set a dedicated WhatsApp number separate from their phone number
    - When a user updates their phone or WhatsApp in profile, it can be synced to their listings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_number text;
  END IF;
END $$;
