/*
  # Fix conversations foreign keys to point to public.profiles

  ## Problem
  The conversations table has buyer_id and seller_id foreign keys pointing to auth.users,
  but the PostgREST join syntax used in Messages.tsx expects them to point to public.profiles.

  ## Changes
  - Drop existing buyer_id and seller_id foreign keys (if they point to auth.users)
  - Recreate them pointing to public.profiles
  - This allows PostgREST to resolve the join:
    buyer_profile:profiles!conversations_buyer_id_fkey
    seller_profile:profiles!conversations_seller_id_fkey

  ## Notes
  - profiles.id mirrors auth.users.id so data integrity is maintained
*/

DO $$
BEGIN
  -- Drop existing buyer_id FK if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_buyer_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_buyer_id_fkey;
  END IF;

  -- Drop existing seller_id FK if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_seller_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_seller_id_fkey;
  END IF;
END $$;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
