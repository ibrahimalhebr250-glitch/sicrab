/*
  # Add foreign key relationships between conversations and profiles

  ## Changes
  - Adds FK from conversations.buyer_id -> profiles.id
  - Adds FK from conversations.seller_id -> profiles.id
  - These are needed for PostgREST to resolve the join syntax used in Messages.tsx

  ## Notes
  - Uses IF NOT EXISTS pattern via DO block to avoid errors on re-run
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_buyer_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_seller_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
