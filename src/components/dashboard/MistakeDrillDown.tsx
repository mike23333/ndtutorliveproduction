import React, { useState, useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import { ArrowLeftIcon } from '../../theme/icons';
import { MistakeCard } from './MistakeCard';
import type { ClassMistakesData, MistakeErrorType } from '../../types/dashboard';

interface MistakeDrillDownProps {
  data: ClassMistakesData | null;
  onClose: () => void;
}

const ERROR_TYPES: MistakeErrorType[] = ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'];

export const MistakeDrillDown: React.FC<MistakeDrillDownProps> = ({ data, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<MistakeErrorType | 'all'>('all');

  const filteredMistakes = useMemo(() => {
    if (!data?.mistakes) return [];
    if (activeFilter === 'all') return data.mistakes;
    return data.mistakes.filter((m) => m.errorType === activeFilter);
  }, [data?.mistakes, activeFilter]);

  const totalMistakes = data?.mistakes.length || 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: AppColors.surfaceDark,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '24px 20px',
        }}
      >
        {/* Minimal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              margin: '-8px',
              color: AppColors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeftIcon size={24} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                margin: 0,
                color: AppColors.textPrimary,
                letterSpacing: '-0.5px',
              }}
            >
              Mistakes
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: AppColors.textSecondary,
                margin: '4px 0 0 0',
                fontWeight: 400,
              }}
            >
              {totalMistakes} from your class
            </p>
          </div>
        </div>

        {/* Simple Filter Tabs - Single Row */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '28px',
            padding: '4px',
            background: AppColors.surfaceLight,
            borderRadius: '12px',
          }}
        >
          <FilterTab
            label="All"
            count={totalMistakes}
            isActive={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          {ERROR_TYPES.map((type) => (
            <FilterTab
              key={type}
              label={type}
              count={data?.summary[type] || 0}
              isActive={activeFilter === type}
              onClick={() => setActiveFilter(type)}
            />
          ))}
        </div>

        {/* Content */}
        {filteredMistakes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: AppColors.textSecondary,
            }}
          >
            <p style={{ fontSize: '17px', margin: 0 }}>
              No mistakes found.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredMistakes.map((mistake) => (
              <MistakeCard key={mistake.id} mistake={mistake} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Clean filter tab
interface FilterTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      background: isActive ? AppColors.surfaceMedium : 'transparent',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 8px',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: '13px',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
    }}
  >
    <span style={{ fontSize: '17px', fontWeight: 600 }}>{count}</span>
    <span style={{ fontSize: '11px', opacity: 0.8 }}>{label}</span>
  </button>
);
