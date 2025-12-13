import React, { useState, useRef, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { ChevronDownIcon } from '../../theme/icons';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }} ref={containerRef}>
      <label
        style={{
          display: 'block',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          fontWeight: 500,
          color: AppColors.textSecondary,
          marginBottom: 'clamp(4px, 1vw, 6px)',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: 'clamp(40px, 8vw, 48px)',
            background: AppColors.surfaceMedium,
            border: `1px solid ${isOpen ? AppColors.accentPurple : AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            padding: '0 clamp(10px, 2.5vw, 14px)',
            color: selectedOption ? AppColors.textPrimary : AppColors.textSecondary,
            fontSize: 'clamp(14px, 3vw, 16px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
          }}
        >
          <span>{selectedOption?.label || 'Select...'}</span>
          <span
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronDownIcon size={16} />
          </span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: AppColors.bgSecondary,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              zIndex: 100,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(10px, 2.5vw, 14px)',
                  background: opt.value === value ? AppColors.accentPurple + '20' : 'transparent',
                  border: 'none',
                  color: opt.value === value ? AppColors.accentPurple : AppColors.textPrimary,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value) {
                    e.currentTarget.style.background = AppColors.surfaceMedium;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = opt.value === value ? AppColors.accentPurple + '20' : 'transparent';
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
