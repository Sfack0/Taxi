import { useRef } from 'react';
import { usePhoneInput, CountrySelector } from 'react-international-phone';
import 'react-international-phone/style.css';

interface PhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const PhoneField = ({ value, onChange, label, placeholder, required }: PhoneFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { inputValue, handlePhoneValueChange, country, setCountry, inputRef: phoneInputRef } = usePhoneInput({
    defaultCountry: 'gr',
    value,
    disableDialCodeAndPrefix: true,
    onChange: (data) => onChange(data.phone),
    inputRef,
  });

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {/* Country selector + dial code */}
        <CountrySelector
          selectedCountry={country.iso2}
          onSelect={(c) => setCountry(c.iso2, { focusOnInput: true })}
          renderButtonWrapper={({ children, rootProps }) => (
            <button
              {...rootProps}
              type="button"
              className="flex items-center gap-1 px-2.5 py-2.5 sm:py-3 shrink-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {children}
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                +{country.dialCode}
              </span>
            </button>
          )}
          dropdownStyleProps={{
            className: 'phone-dropdown',
            listItemClassName: 'phone-dropdown-item',
          }}
        />
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 shrink-0" />
        {/* Phone input */}
        <input
          ref={phoneInputRef}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 px-3 py-2.5 sm:py-3 bg-transparent text-base font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default PhoneField;
