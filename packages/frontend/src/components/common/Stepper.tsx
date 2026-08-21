interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
}

const Stepper = ({ value, onChange, min = 0, max = 15, icon }: StepperProps) => {
  const current = value ?? min;
  const canDecrement = current > min;
  const canIncrement = current < max;

  const decrement = () => {
    if (canDecrement) onChange(current - 1);
  };
  const increment = () => {
    if (canIncrement) onChange(current + 1);
  };

  const btnBase =
    'flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
  const btnEnabled = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 cursor-pointer';
  const btnDisabled = 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed';

  return (
    <div className="inline-flex items-center gap-1 px-1 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      <button
        type="button"
        onClick={decrement}
        disabled={!canDecrement}
        aria-label="minus"
        className={`${btnBase} ${canDecrement ? btnEnabled : btnDisabled}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </button>

      <div className="flex items-center justify-center gap-1 w-12 sm:w-14">
        {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
        <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
          {current}
        </span>
      </div>

      <button
        type="button"
        onClick={increment}
        disabled={!canIncrement}
        aria-label="plus"
        className={`${btnBase} ${canIncrement ? btnEnabled : btnDisabled}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default Stepper;
