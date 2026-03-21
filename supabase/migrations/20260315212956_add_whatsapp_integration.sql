/*
  # Add WhatsApp Integration to Listings

  ## Overview
  This migration adds WhatsApp contact functionality to listings, allowing buyers to contact sellers directly via WhatsApp with tracking.

  ## Changes

  ### Modified Tables

  #### `listings`
  - Add `whatsapp_number` (text) - WhatsApp contact number for the listing
  - Add `whatsapp_clicks` (integer) - Track number of WhatsApp contact attempts

  ## Important Notes
  1. WhatsApp number is optional but recommended for better response rates
  2. Click tracking helps sellers understand engagement
  3. WhatsApp links will auto-populate with listing details
  4. Phone numbers remain private, only WhatsApp contact is visible
*/

-- Add WhatsApp fields to listings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'whatsapp_number') THEN
    ALTER TABLE listings ADD COLUMN whatsapp_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'whatsapp_clicks') THEN
    ALTER TABLE listings ADD COLUMN whatsapp_clicks integer DEFAULT 0;
  END IF;
END $$;

-- Create function to increment WhatsApp clicks
CREATE OR REPLACE FUNCTION increment_whatsapp_clicks(listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET whatsapp_clicks = whatsapp_clicks + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_whatsapp_clicks(uuid) TO authenticated;