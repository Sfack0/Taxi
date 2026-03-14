import { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import BottomSheet from './BottomSheet';

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

interface MobileDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  dateFormat?: string;
  locale?: string;
  placeholderText?: string;
  showTimeSelect?: boolean;
  showTimeSelectOnly?: boolean;
  timeIntervals?: number;
  timeFormat?: string;
  timeCaption?: string;
  sheetTitle?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
}

const TriggerButton = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string; className?: string; icon?: React.ReactNode }>(
  ({ value, onClick, placeholder, className, icon }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className={`${className} text-left cursor-pointer overflow-hidden whitespace-nowrap`}
    >
      {icon && (
        <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          {icon}
        </span>
      )}
      <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
        {value || placeholder}
      </span>
    </button>
  )
);
TriggerButton.displayName = 'TriggerButton';

const MobileDatePicker = ({
  selected,
  onChange,
  minDate,
  dateFormat,
  locale,
  placeholderText,
  showTimeSelect,
  showTimeSelectOnly,
  timeIntervals,
  timeFormat,
  timeCaption,
  sheetTitle,
  buttonClassName,
  icon,
}: MobileDatePickerProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const mobile = isTouchDevice();

  // Format value for display
  const formatDisplay = () => {
    if (!selected) return '';
    if (showTimeSelectOnly) {
      return selected.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const d = selected.getDate().toString().padStart(2, '0');
    const m = (selected.getMonth() + 1).toString().padStart(2, '0');
    const y = selected.getFullYear().toString().slice(-2);
    return `${d}/${m}/${y}`;
  };

  if (mobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`${buttonClassName} text-left cursor-pointer overflow-hidden whitespace-nowrap relative`}
        >
          {icon && (
            <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
              {icon}
            </span>
          )}
          <span className={selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
            {formatDisplay() || placeholderText}
          </span>
        </button>

        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title={sheetTitle}>
          <div className="flex justify-center px-4 pb-6 pt-2 mobile-inline-picker">
            <DatePicker
              selected={selected}
              onChange={(date) => {
                onChange(date);
                // For time-only, close immediately; for date, close after selection
                setSheetOpen(false);
              }}
              minDate={minDate}
              dateFormat={dateFormat}
              locale={locale}
              inline
              showTimeSelect={showTimeSelect}
              showTimeSelectOnly={showTimeSelectOnly}
              timeIntervals={timeIntervals}
              timeFormat={timeFormat}
              timeCaption={timeCaption}
            />
          </div>
        </BottomSheet>
      </>
    );
  }

  // Desktop: normal popper-based DatePicker
  return (
    <div className="relative booking-datepicker">
      {icon && (
        <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          {icon}
        </span>
      )}
      <DatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        dateFormat={dateFormat}
        locale={locale}
        placeholderText={placeholderText}
        popperPlacement="bottom-start"
        showTimeSelect={showTimeSelect}
        showTimeSelectOnly={showTimeSelectOnly}
        timeIntervals={timeIntervals}
        timeFormat={timeFormat}
        timeCaption={timeCaption}
        customInput={<TriggerButton className={buttonClassName || ''} />}
      />
    </div>
  );
};

export default MobileDatePicker;
