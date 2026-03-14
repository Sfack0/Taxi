import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
  label?: string;
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const NumberPicker = ({ value, onChange, min = 1, max = 8, icon, label }: NumberPickerProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const title = label || t('booking.people');

  // Close on click outside (desktop only)
  useEffect(() => {
    if (!isOpen || isTouchDevice()) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (num: number) => {
    onChange(num);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-2 sm:px-3 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {icon && (
          <span className="shrink-0 text-gray-400">
            {icon}
          </span>
        )}
        <span>{value !== undefined && value !== null ? value : min}</span>
      </button>

      {/* Desktop dropdown */}
      {isOpen && !isTouchDevice() && (
        <div className="absolute z-50 bottom-full mb-1 w-full min-w-[180px] rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {options.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSelect(num)}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  value === num
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      <BottomSheet isOpen={isOpen && isTouchDevice()} onClose={() => setIsOpen(false)} title={title}>
        <div className="grid grid-cols-4 gap-3 px-5 py-4">
          {options.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleSelect(num)}
              className={`py-4 rounded-xl text-lg font-semibold transition-colors ${
                value === num
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 active:bg-gray-200 dark:active:bg-gray-600'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default NumberPicker;
