import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  icon?: React.ReactNode;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  placeholder = 'Tanlang...',
  value,
  onChange,
  options = [],
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  triggerClassName = '',
  icon,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full h-12 flex items-center justify-between text-sm font-medium bg-white border rounded-xl py-3 px-4 transition duration-150 focus:outline-none focus:ring-1 focus:ring-[#163D5C] text-left ${
            isOpen
              ? 'border-[#163D5C] ring-1 ring-[#163D5C]'
              : error
              ? 'border-red-300'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer'} ${triggerClassName}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
            <span
              className={`truncate ${
                selectedOption
                  ? 'text-slate-800 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              isOpen ? 'rotate-180 text-[#163D5C]' : ''
            }`}
          />
        </button>

        {/* Floating Dropdown Menu (Screenshot 3 design) */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white rounded-2xl p-1.5 shadow-xl shadow-slate-200/70 border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                Variantlar mavjud emas
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition duration-150 text-left ${
                      isSelected
                        ? 'bg-[#163D5C]/10 text-[#163D5C] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {/* Checkmark icon for selected option */}
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                      ) : null}
                    </div>

                    <div className="flex-1 truncate">
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
