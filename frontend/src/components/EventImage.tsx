import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface EventImageProps {
  src?: string;
  alt: string;
  className?: string;
  variant?: 'card' | 'banner' | 'preview';
}

const variantClasses = {
  card: 'aspect-video',
  banner: 'h-full min-h-[18rem]',
  preview: 'aspect-video',
};

export const EventImage: React.FC<EventImageProps> = ({ src, alt, className = '', variant = 'card' }) => {
  const [failed, setFailed] = useState(false);
  const shouldShowImage = Boolean(src) && !failed;

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${variantClasses[variant]} ${className}`}>
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 via-slate-900 to-orange-500">
          <div className="flex flex-col items-center gap-2 text-white/90">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-black uppercase tracking-wide">EventHub</span>
          </div>
        </div>
      )}
    </div>
  );
};
