/*
  # إنشاء Storage Bucket للصور

  1. Storage
    - إنشاء bucket باسم `images` لتخزين صور الإعلانات
    - تفعيل الوصول العام للصور
    - تطبيق سياسات RLS للتحكم في الرفع والحذف

  2. السياسات
    - السماح بعرض الصور للجميع
    - السماح برفع الصور للمستخدمين المسجلين فقط
    - السماح بحذف الصور لأصحابها فقط
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view images'
  ) THEN
    CREATE POLICY "Anyone can view images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'images' AND
        (storage.foldername(name))[1] = 'listings'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own images'
  ) THEN
    CREATE POLICY "Users can update their own images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'images' AND auth.uid() = owner::uuid)
      WITH CHECK (bucket_id = 'images' AND auth.uid() = owner::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own images'
  ) THEN
    CREATE POLICY "Users can delete their own images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'images' AND auth.uid() = owner::uuid);
  END IF;
END $$;