import { useState, useEffect, useCallback, useRef } from 'react';

const IMAGES = [
  '/images/elafonisi-13.jpg',
  '/images/chania-old-port-5.jpg',
  '/images/heraklio1.jpg',
  '/images/koules_fortress_1.webp',
  '/images/Bali-Rethymno-Crete-Greece-allincrete.com-52.jpg',
  '/images/rethymno_intro.jpg',
  '/images/Georgioupoli_3.jpg',
  '/images/knossos-palace-at-crete-greece.webp',
  '/images/Voulisma-Beach-bestcretedestinations.gr_.webp',
  '/images/Sisi-Sissi-Village-Lasithi-Crete-Copyright-Allincrete.com-7-of-20.jpg',
  '/images/6051e716db971.jpg',
  '/images/5.jpg',
  '/images/istockphoto-1197950653-612x612.jpg',
];

const SWIPE_THRESHOLD = 50;

interface HeroCarouselProps {
  children: React.ReactNode;
}

const HeroCarousel = ({ children }: HeroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % IMAGES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + IMAGES.length) % IMAGES.length);
  }, []);

  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset < 0) {
        next();
      } else {
        prev();
      }
    }
    setDragOffset(0);
  };

  const containerWidth = containerRef.current?.offsetWidth || 1;
  const dragPercent = (dragOffset / containerWidth) * 100;
  const translateX = -(current * 100) + dragPercent;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[500px] sm:min-h-[550px] md:min-h-[600px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding background images */}
      <div
        className={`absolute inset-0 flex ${isDragging ? '' : 'transition-transform duration-700 ease-in-out'}`}
        style={{ width: `${IMAGES.length * 100}%`, transform: `translateX(${translateX / IMAGES.length}%)` }}
      >
        {IMAGES.map((src, i) => (
          <div key={src} className="relative h-full" style={{ width: `${100 / IMAGES.length}%` }}>
            <img
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[500px] sm:min-h-[550px] md:min-h-[600px] px-4">
        {children}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
