import { useEffect, useState } from 'react';

type Status = 'loading' | 'loaded' | 'error';

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  /** Outer wrapper className — must include height/aspect-ratio to prevent CLS. */
  className?: string;
}

function ImageFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <svg
        className="h-10 w-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    </div>
  );
}

export default function SmartImage({ src, alt, className = '' }: SmartImageProps) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');

  // Reset state when src changes (e.g. editing a product)
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton: visible while loading */}
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-gray-200" />}

      {/* Fallback: shown when src is absent or broken */}
      {status === 'error' && <ImageFallback />}

      {/* Image: in DOM as soon as src exists; fades in on load */}
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}
