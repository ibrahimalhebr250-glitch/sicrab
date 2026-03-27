/*
  # Enable Realtime for Rewards Tables

  Enables Supabase Realtime publication for all reward-related tables
  so that users and admins see live updates without page refresh.

  ## Tables added to realtime
  - reputation_scores
  - reputation_events
  - cashback_wallet
  - cashback_transactions
  - referral_codes
  - safedeal_certifications
  - safedeal_deals
  - reputation_point_actions
*/

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'reputation_scores',
    'reputation_events',
    'cashback_wallet',
    'cashback_transactions',
    'referral_codes',
    'safedeal_certifications',
    'safedeal_deals',
    'reputation_point_actions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END $$;
