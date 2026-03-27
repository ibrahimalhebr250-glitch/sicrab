/*
  # Enable Realtime for Messaging Tables

  Enables Supabase Realtime publication for the conversations and messages tables
  so that clients can subscribe to live updates using postgres_changes.

  ## Changes
  - Add conversations table to supabase_realtime publication
  - Add messages table to supabase_realtime publication
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
