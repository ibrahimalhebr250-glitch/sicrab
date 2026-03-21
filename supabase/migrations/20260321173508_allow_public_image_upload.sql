/*
  # Allow Public Image Upload

  ## Changes
  - Drop the authenticated-only INSERT policy on storage.objects
  - Create a new public INSERT policy that allows anyone to upload images
  - This enables image upload before login (auth required only at listing publish step)
*/

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'images');
