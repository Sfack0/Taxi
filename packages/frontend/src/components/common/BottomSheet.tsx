import { useEffect, useRef, type ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // iOS Safari: push sheet above the virtual keyboard using visualViewport API
  useEffect(() => {
    if (!isOpen) return;

    const applyOffset = () => {
      const vv = window.visualViewport;
      if (!vv || !sheetRef.current) return;
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sheetRef.current.style.transform = keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : '';
    };

    // Wrap in rAF + small timeout: iOS fires the event before keyboard animation completes
    const update = () => requestAnimationFrame(applyOffset);
    const updateDelayed = () => { update(); setTimeout(applyOffset, 300); };

    const sheetEl = sheetRef.current;

    applyOffset();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    // Also catch focus inside the sheet (iOS doesn't always fire visualViewport on first focus)
    sheetEl?.addEventListener('focusin', updateDelayed);
    sheetEl?.addEventListener('focusout', updateDelayed);

    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      sheetEl?.removeEventListener('focusin', updateDelayed);
      sheetEl?.removeEventListener('focusout', updateDelayed);
      if (sheetRef.current) sheetRef.current.style.transform = '';
    };
  }, [isOpen]);

  // Handle Android back button
  useEffect(() => {
    if (!isOpen) return;
    const closedByBack = { current: false };
    history.pushState(null, '');

    const handlePopState = () => {
      closedByBack.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByBack.current) {
        history.back();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div ref={sheetRef} className="relative bg-white dark:bg-gray-800 rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Title */}
        {title && (
          <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 pb-3 mb-0 border-b-2 border-amber-500/30">
            {title}
          </p>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain safe-area-bottom">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
