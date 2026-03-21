import { useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { uploadImage, validateImageFile } from '../lib/imageUpload';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onChange, maxImages = 6 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > maxImages) {
      setError(`يمكنك إضافة ${maxImages} صور كحد أقصى`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        const result = await uploadImage(file);
        uploadedUrls.push(result.url);
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError('فشل في رفع بعض الصور. حاول مرة أخرى.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img src={url} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-500">جاري الرفع...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">رفع صورة</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-500">
        يمكنك إضافة حتى {maxImages} صور. الصيغ المسموحة: JPG, PNG, WEBP (حجم أقصى: 5 ميجا)
      </div>
    </div>
  );
}
