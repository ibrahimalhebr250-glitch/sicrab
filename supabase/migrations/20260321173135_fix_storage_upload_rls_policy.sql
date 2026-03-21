/*
  # Fix Storage Upload RLS Policy

  ## Problem
  The current INSERT policy for storage.objects requires authenticated users
  but doesn't explicitly check auth.uid() IS NOT NULL, causing 403 errors
  when uploading images.

  ## Changes
  - Drop and recreate the INSERT policy with explicit authentication check
  - Allow authenticated users to upload to the listings folder
  - Also allow uploads to user-specific folders for flexibility
*/

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
  );
