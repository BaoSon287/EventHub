import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { Button } from './Button';
import { EventImage } from './EventImage';
import { useToast } from './ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  uploadFn: (file: File) => Promise<{ imageUrl: string; fileName?: string }>;
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  fallbackImage?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  uploadFn,
  label = 'Image upload',
  helperText = 'JPG, PNG or WEBP up to 5MB.',
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  fallbackImage,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);

  const validate = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Only JPG, PNG and WEBP images are allowed.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image size must be ${maxSizeMB}MB or smaller.`;
    }
    return '';
  };

  const handleFile = async (file?: File) => {
    if (!file || disabled) return;
    setError('');

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      toast.error('Invalid image', validationError);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    try {
      const result = await uploadFn(file);
      onChange(result.imageUrl);
      toast.success('Image uploaded', result.fileName || file.name);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not upload image.');
      setError(message);
      toast.error('Upload failed', message);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFileName('');
    setError('');
    onChange(fallbackImage || '');
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400">{label}</label>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">{helperText}</p>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`rounded-2xl border border-dashed p-4 transition ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          className="hidden"
          disabled={disabled || uploading}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <EventImage
              src={value || fallbackImage}
              alt="Event image preview"
              variant="preview"
              className="rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 lg:col-span-7">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">
                  {uploading ? 'Uploading image...' : 'Drop an image here or choose a file'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {fileName || 'Recommended ratio: 16:9 for event banners.'}
                </p>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
                leftIcon={<ImagePlus className="h-4 w-4" />}
                className="font-bold"
              >
                {value ? 'Change image' : 'Choose image'}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || uploading}
                  onClick={removeImage}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="font-bold text-red-500 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
