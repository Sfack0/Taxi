import { useState, useRef, useEffect } from 'react';
import BottomSheet from './BottomSheet';

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
  label?: string;
  sheetTitle?: string;
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const SortDropdown = ({ value, options, onChange, label, sheetTitle }: SortDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside (desktop only)
  useEffect(() => {
    if (!open || isTouchDevice()) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        {label && <span className="text-gray-500 dark:text-gray-400">{label}</span>}
        <span className="font-medium">{selected?.label}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desktop dropdown */}
      {open && !isTouchDevice() && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[180px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Mobile bottom sheet */}
      <BottomSheet isOpen={open && isTouchDevice()} onClose={() => setOpen(false)} title={sheetTitle}>
        <div className="pb-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-5 py-3.5 text-sm font-medium border-b border-gray-50 dark:border-gray-700/50 transition-colors ${
                value === opt.value
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                {opt.label}
                {value === opt.value && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default SortDropdown;
