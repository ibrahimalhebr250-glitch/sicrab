import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'demo';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export const uploadImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
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
