import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src?: string;
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BookCover: React.FC<BookCoverProps> = ({
  src,
  title,
  className = '',
  size = 'md'
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const isInvalidSrc = !src || src.trim() === '' || src === '-' || (!src.startsWith('http') && !src.startsWith('data:image/'));

  // If no src or error occurred, render attractive fallback placeholder
  if (isInvalidSrc || hasError) {
    // Generate deterministic pleasing hue based on title
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-indigo-600 to-purple-700',
      'from-emerald-600 to-teal-700',
      'from-cyan-600 to-blue-700',
      'from-amber-600 to-orange-700',
      'from-rose-600 to-pink-700'
    ];
    const gradient = gradients[Math.abs(hash) % gradients.length];

    return (
      <div
        className={`bg-gradient-to-br ${gradient} text-white flex flex-col items-center justify-between p-1.5 rounded-lg shadow-2xs relative overflow-hidden select-none ${className}`}
        title={title}
      >
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-white/20" />
        <div className="w-full flex justify-end">
          <BookOpen className="w-3.5 h-3.5 opacity-60" />
        </div>
        <div className="text-center w-full px-1 my-auto">
          <p className="text-[9px] font-bold leading-tight line-clamp-2 uppercase tracking-tight">
            {title}
          </p>
        </div>
        <div className="w-full text-[7px] text-white/70 font-mono tracking-widest text-center">
          BUKU
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      onError={() => setHasError(true)}
      className={`object-cover rounded-lg shadow-2xs ${className}`}
      loading="lazy"
    />
  );
};
