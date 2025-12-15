import React from 'react';
import { AppColors } from '../../theme/colors';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'number' | 'email' | 'password';
  min?: number;
  max?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 4,
  type = 'text',
  min,
  max,
}) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      let numValue = parseInt(e.target.value) || 0;
      if (min !== undefined) numValue = Math.max(min, numValue);
      if (max !== undefined) numValue = Math.min(max, numValue);
      onChange(numValue.toString());
    } else {
      onChange(e.target.value);
    }
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    background: AppColors.surfaceLight,
    border: `1px solid ${AppColors.borderColor}`,
    borderRadius: 'clamp(8px, 2vw, 12px)',
    padding: multiline ? 'clamp(10px, 2.5vw, 14px)' : '0 clamp(10px, 2.5vw, 14px)',
    color: AppColors.textPrimary,
    fontSize: 'clamp(14px, 3vw, 16px)',
    boxSizing: 'border-box',
  };

  return (
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
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          style={{
            ...inputStyles,
            minHeight: 'clamp(80px, 15vw, 100px)',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleNumberChange}
          min={min}
          max={max}
          style={{
            ...inputStyles,
            height: 'clamp(40px, 8vw, 48px)',
          }}
        />
      )}
    </div>
  );
};
