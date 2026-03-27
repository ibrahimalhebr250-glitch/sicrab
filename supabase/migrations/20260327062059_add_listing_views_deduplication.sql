/*
  # Add Listing Views Deduplication

  Replace the simple increment function with one that tracks unique views per visitor.
  
  1. New Table
    - `listing_views`
      - `id` (uuid, primary key)
      - `listing_id` (uuid)
      - `visitor_key` (text) - either user_id or anonymous session key
      - `created_at` (timestamp)
      - Unique constraint on (listing_id, visitor_key) to prevent duplicates

  2. New Function
    - `increment_listing_views_unique` - Only increments if this visitor hasn't viewed before
*/

CREATE TABLE IF NOT EXISTS listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, visitor_key)
);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert listing views"
  ON listing_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read listing views"
  ON listing_views FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_visitor_key ON listing_views(visitor_key);

CREATE OR REPLACE FUNCTION increment_listing_views_unique(
  p_listing_id uuid,
  p_visitor_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted boolean := false;
BEGIN
  INSERT INTO listing_views (listing_id, visitor_key)
  VALUES (p_listing_id, p_visitor_key)
  ON CONFLICT (listing_id, visitor_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    UPDATE listings
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_listing_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
