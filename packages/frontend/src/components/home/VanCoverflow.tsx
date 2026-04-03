import { useState, useEffect, useRef, useCallback } from 'react';

const FALLBACK_IMAGES = [
  '/images/van/van-1.jpeg',
  '/images/van/van-2.jpeg',
  '/images/van/van-3.jpeg',
  '/images/van/van-4.jpeg',
];

const SWIPE_THRESHOLD = 40;

interface VanCoverflowProps {
  images?: string[];
}

const VanCoverflow = ({ images }: VanCoverflowProps) => {
  const IMAGES = images && images.length > 0 ? images : FALLBACK_IMAGES;
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const dragOffset = useRef(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % IMAGES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + IMAGES.length) % IMAGES.length);
  }, []);

  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    dragOffset.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    dragOffset.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset.current) > SWIPE_THRESHOLD) {
      if (dragOffset.current < 0) next();
      else prev();
    }
    dragOffset.current = 0;
  };

  return (
    <div
      className="relative w-full select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image container */}
      <div className="relative w-full overflow-hidden rounded-2xl shadow-lg" style={{ paddingBottom: '75%' }}>
        {IMAGES.map((src, i) => {
          const isActive = i === current;
          return (
            <img
              key={src}
              src={src}
              alt={`Van photo ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1)' : 'scale(1.05)',
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          );
        })}

        {/* Arrow buttons inside image */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          aria-label="Next"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
          {current + 1} / {IMAGES.length}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2.5 mt-4">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-amber-500 scale-125'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-amber-400'
            }`}
            aria-label={`Photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default VanCoverflow;
