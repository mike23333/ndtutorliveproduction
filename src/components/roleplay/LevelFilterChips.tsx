/**
 * LevelFilterChips - Premium Horizontal Filter Chips
 * Glass-morphic styling with smooth animations
 */

import { AppColors, radius } from '../../theme/colors';

interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface LevelFilterChipsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

export const LevelFilterChips = ({
  filters,
  activeFilter,
  onFilterChange,
}: LevelFilterChipsProps) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{`
        .filter-chips-container::-webkit-scrollbar { display: none; }
        .filter-chip {
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .filter-chip:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.12);
          border-color: rgba(216, 180, 254, 0.25);
        }
        .filter-chip:active {
          transform: scale(0.96);
        }
        .filter-chip.active {
          background: linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%);
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
        }
      `}</style>

      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            className={`filter-chip ${isActive ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.key)}
            style={{
              padding: '10px 18px',
              borderRadius: radius.full,
              border: isActive ? 'none' : `1.5px solid ${AppColors.borderColor}`,
              backgroundColor: isActive ? undefined : AppColors.bgTertiary,
              color: isActive ? '#1a0a2e' : AppColors.textPrimary,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: isActive ? 0.8 : 0.6,
                }}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
