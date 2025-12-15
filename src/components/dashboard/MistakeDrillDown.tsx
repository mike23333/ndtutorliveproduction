import React, { useState, useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import { ArrowLeftIcon } from '../../theme/icons';
import { MistakeCard } from './MistakeCard';
import type { ClassMistakesData, MistakeErrorType, ClassMistake } from '../../types/dashboard';

interface MistakeDrillDownProps {
  data: ClassMistakesData | null;
  onClose: () => void;
}

const ERROR_TYPES: MistakeErrorType[] = ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'];

const ERROR_TYPE_CONFIG: Record<MistakeErrorType, { color: string; icon: string }> = {
  Grammar: { color: '#FF6B81', icon: '✏️' },
  Pronunciation: { color: '#A855F7', icon: '🗣️' },
  Vocabulary: { color: '#60A5FA', icon: '📚' },
  Cultural: { color: '#FBBF24', icon: '🌍' },
};

// Group mistakes by date
const groupMistakesByDate = (mistakes: ClassMistake[]): Map<string, ClassMistake[]> => {
  const groups = new Map<string, ClassMistake[]>();

  for (const mistake of mistakes) {
    const date = new Date(mistake.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        dateKey = date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(mistake);
  }

  return groups;
};

export const MistakeDrillDown: React.FC<MistakeDrillDownProps> = ({ data, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<MistakeErrorType | 'all'>('all');

  const filteredMistakes = useMemo(() => {
    if (!data?.mistakes) return [];
    if (activeFilter === 'all') return data.mistakes;
    return data.mistakes.filter((m) => m.errorType === activeFilter);
  }, [data?.mistakes, activeFilter]);

  const groupedMistakes = useMemo(() => groupMistakesByDate(filteredMistakes), [filteredMistakes]);

  const totalMistakes = data?.mistakes.length || 0;
  const summary = data?.summary || { Grammar: 0, Pronunciation: 0, Vocabulary: 0, Cultural: 0 };

  // Find the most common mistake type
  const topMistakeType = useMemo(() => {
    let maxType: MistakeErrorType = 'Grammar';
    let maxCount = 0;
    for (const type of ERROR_TYPES) {
      if ((summary[type] || 0) > maxCount) {
        maxCount = summary[type] || 0;
        maxType = type;
      }
    }
    return maxType;
  }, [summary]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: AppColors.bgPrimary,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mistake-group {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        .mistake-item {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: 'clamp(16px, 4vw, 24px)',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 16px)',
            marginBottom: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 700,
                margin: 0,
                color: AppColors.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              All Mistakes
            </h1>
            <p
              style={{
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                color: AppColors.textSecondary,
                margin: '2px 0 0 0',
              }}
            >
              {totalMistakes} from your class
            </p>
          </div>
        </div>

        {/* Summary Card */}
        {totalMistakes > 0 && (
          <div
            style={{
              background: `linear-gradient(135deg, ${ERROR_TYPE_CONFIG[topMistakeType].color}15 0%, transparent 100%)`,
              borderRadius: 'clamp(16px, 4vw, 20px)',
              padding: 'clamp(16px, 4vw, 20px)',
              marginBottom: 'clamp(20px, 5vw, 24px)',
              border: `1px solid ${ERROR_TYPE_CONFIG[topMistakeType].color}25`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{ERROR_TYPE_CONFIG[topMistakeType].icon}</span>
              <div>
                <p
                  style={{
                    fontSize: 'clamp(13px, 2.8vw, 14px)',
                    color: AppColors.textSecondary,
                    margin: 0,
                  }}
                >
                  Most common issue
                </p>
                <p
                  style={{
                    fontSize: 'clamp(17px, 4vw, 19px)',
                    fontWeight: 700,
                    color: ERROR_TYPE_CONFIG[topMistakeType].color,
                    margin: '2px 0 0 0',
                  }}
                >
                  {topMistakeType}
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textSecondary,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {summary[topMistakeType]} of {totalMistakes} mistakes ({Math.round((summary[topMistakeType] / totalMistakes) * 100)}%) are {topMistakeType.toLowerCase()} related
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.5vw, 8px)',
            marginBottom: 'clamp(20px, 5vw, 28px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '2px',
          }}
        >
          <FilterChip
            label="All"
            count={totalMistakes}
            isActive={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          {ERROR_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={type}
              count={summary[type] || 0}
              isActive={activeFilter === type}
              onClick={() => setActiveFilter(type)}
              color={ERROR_TYPE_CONFIG[type].color}
              icon={ERROR_TYPE_CONFIG[type].icon}
            />
          ))}
        </div>

        {/* Content */}
        {filteredMistakes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'clamp(48px, 12vw, 80px) clamp(20px, 5vw, 32px)',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'clamp(16px, 4vw, 20px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>🔍</div>
            <p
              style={{
                fontSize: 'clamp(16px, 3.5vw, 18px)',
                fontWeight: 600,
                color: AppColors.textPrimary,
                margin: '0 0 8px 0',
              }}
            >
              No mistakes found
            </p>
            <p
              style={{
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                color: AppColors.textSecondary,
                margin: 0,
              }}
            >
              {activeFilter === 'all'
                ? "Your students haven't made any mistakes yet"
                : `No ${activeFilter.toLowerCase()} mistakes in this period`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 6vw, 32px)' }}>
            {Array.from(groupedMistakes.entries()).map(([dateLabel, mistakes], groupIndex) => (
              <div
                key={dateLabel}
                className="mistake-group"
                style={{ animationDelay: `${groupIndex * 0.05}s`, opacity: 0 }}
              >
                {/* Date Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: 'clamp(12px, 3vw, 16px)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 'clamp(13px, 2.8vw, 14px)',
                      fontWeight: 600,
                      color: AppColors.textSecondary,
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {dateLabel}
                  </h3>
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.08)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'clamp(11px, 2.2vw, 12px)',
                      color: AppColors.textMuted,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    {mistakes.length}
                  </span>
                </div>

                {/* Mistakes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 12px)' }}>
                  {mistakes.map((mistake, index) => (
                    <div
                      key={mistake.id}
                      className="mistake-item"
                      style={{
                        animationDelay: `${groupIndex * 0.05 + index * 0.03}s`,
                        opacity: 0,
                      }}
                    >
                      <MistakeCard mistake={mistake} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Filter chip component
interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  icon?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  isActive,
  onClick,
  color,
  icon,
}) => {
  const activeColor = color || AppColors.accentPurple;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
        background: isActive
          ? `linear-gradient(135deg, ${activeColor}20 0%, ${activeColor}10 100%)`
          : 'rgba(255, 255, 255, 0.03)',
        border: isActive
          ? `1px solid ${activeColor}40`
          : '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'clamp(10px, 2.5vw, 12px)',
        color: isActive ? activeColor : AppColors.textSecondary,
        fontSize: 'clamp(13px, 2.8vw, 14px)',
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      <span>{label}</span>
      <span
        style={{
          fontSize: 'clamp(11px, 2.2vw, 12px)',
          fontWeight: 700,
          background: isActive ? `${activeColor}25` : 'rgba(255, 255, 255, 0.08)',
          padding: '2px 8px',
          borderRadius: '10px',
          color: isActive ? activeColor : AppColors.textMuted,
        }}
      >
        {count}
      </span>
    </button>
  );
};
