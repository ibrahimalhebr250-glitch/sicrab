/*
  # Fix seller_reviews buyer_id foreign key

  Changes the buyer_id foreign key from auth.users to public.profiles
  so PostgREST can resolve the join relationship correctly in queries.
*/

ALTER TABLE seller_reviews DROP CONSTRAINT seller_reviews_buyer_id_fkey;

ALTER TABLE seller_reviews
  ADD CONSTRAINT seller_reviews_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL;
