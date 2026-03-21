import { supabase } from './supabase';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export const uploadImage = async (file: File): Promise<UploadedImage> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      publicId: data.path,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('فشل في رفع الصورة. حاول مرة أخرى.');
  }
};

export const uploadMultipleImages = async (files: File[]): Promise<UploadedImage[]> => {
  const uploadPromises = files.map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

export const validateImageFile = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'يجب أن تكون الصورة بصيغة JPG أو PNG أو WEBP';
  }

  if (file.size > maxSize) {
    return 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت';
  }

  return null;
};
