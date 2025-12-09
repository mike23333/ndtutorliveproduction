import React from 'react';
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
}) => (
  <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 'clamp(40px, 8vw, 48px)',
          background: AppColors.surfaceLight,
          border: `1px solid ${AppColors.borderColor}`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          padding: '0 clamp(10px, 2.5vw, 14px)',
          color: AppColors.textPrimary,
          fontSize: 'clamp(14px, 3vw, 16px)',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: '#1a1a2e', color: '#e0e0e0' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div
        style={{
          position: 'absolute',
          right: 'clamp(10px, 2.5vw, 14px)',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: AppColors.textSecondary,
        }}
      >
        <ChevronDownIcon size={16} />
      </div>
    </div>
  </div>
);
