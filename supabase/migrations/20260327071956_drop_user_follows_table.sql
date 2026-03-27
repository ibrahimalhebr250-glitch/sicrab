/*
  # Drop user_follows table

  Permanently removes the user follows/following system from the database.

  1. Changes
    - Drop all RLS policies on user_follows table
    - Drop the user_follows table entirely including all indexes and constraints
*/

DROP TABLE IF EXISTS user_follows CASCADE;
