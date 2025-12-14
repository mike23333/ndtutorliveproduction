/**
 * Review Page Layout - Premium Design
 * Shared layout for all mistake review pages
 * Features: Beautiful header, filter tabs, animated empty states
 */

import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../../theme/colors';
import { ChevronLeftIcon } from '../../theme/icons';
import { ReviewItemErrorType } from '../../types/firestore';

export type FilterType = 'all' | 'unmastered' | 'mastered';

interface CategoryConfig {
  icon: string;
  label: string;
  gradient: string;
  accentColor: string;
  glowColor: string;
  emptyMessage: string;
  emptySubtext: string;
}

const CATEGORY_CONFIG: Record<ReviewItemErrorType, CategoryConfig> = {
  Pronunciation: {
    icon: '🎯',
    label: 'Pronunciation',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)',
    accentColor: '#a78bfa',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    emptyMessage: 'Perfect pronunciation!',
    emptySubtext: 'Your speech is sounding great.',
  },
  Grammar: {
    icon: '📝',
    label: 'Grammar',
    gradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.05) 100%)',
    accentColor: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    emptyMessage: 'Grammar on point!',
    emptySubtext: 'Your sentence structure is excellent.',
  },
  Vocabulary: {
    icon: '📚',
    label: 'Vocabulary',
    gradient: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0.05) 100%)',
    accentColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    emptyMessage: 'Word wizard!',
    emptySubtext: 'Your vocabulary is impressive.',
  },
  Cultural: {
    icon: '🌍',
    label: 'Cultural',
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.05) 100%)',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    emptyMessage: 'Cultural expert!',
    emptySubtext: 'You understand the nuances well.',
  },
};

interface ReviewPageLayoutProps {
  category: ReviewItemErrorType;
  itemCount: number;
  loading: boolean;
  error: string | null;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  children: ReactNode;
}

export default function ReviewPageLayout({
  category,
  itemCount,
  loading,
  error,
  filter,
  onFilterChange,
  children,
}: ReviewPageLayoutProps) {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[category];
  const [isPressed, setIsPressed] = useState(false);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'unmastered', label: 'To Review' },
    { key: 'mastered', label: 'Mastered' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .review-content::-webkit-scrollbar { width: 0; display: none; }
        .review-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .review-content { max-width: 540px; margin: 0 auto; }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-animate {
          animation: float-in 0.4s ease-out;
          animation-fill-mode: both;
        }
        .filter-tab {
          transition: all 0.2s ease;
        }
        .filter-tab:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Premium Header */}
      <div style={{
        position: 'relative',
        padding: '20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        background: config.gradient,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: config.glowColor,
          filter: 'blur(60px)',
          opacity: 0.3,
          pointerEvents: 'none',
        }} />

        {/* Top row with back button and stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          position: 'relative',
        }}>
          <button
            onClick={() => navigate('/progress')}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: isPressed ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeftIcon size={22} />
          </button>

          {/* Item count badge */}
          <div style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: config.accentColor,
            }}>
              {itemCount}
            </span>
            <span style={{
              fontSize: '14px',
              color: AppColors.textSecondary,
              marginLeft: '4px',
            }}>
              {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Title section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          position: 'relative',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: `0 8px 24px ${config.glowColor}`,
          }}>
            {config.icon}
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: '700',
              color: AppColors.textPrimary,
              letterSpacing: '-0.5px',
            }}>
              {config.label}
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: AppColors.textSecondary,
            }}>
              Review and master your mistakes
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '20px',
          position: 'relative',
        }}>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              className="filter-tab"
              onClick={() => onFilterChange(option.key)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: filter === option.key
                  ? `1px solid ${config.accentColor}40`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: filter === option.key
                  ? `${config.accentColor}20`
                  : 'rgba(255, 255, 255, 0.04)',
                color: filter === option.key
                  ? config.accentColor
                  : AppColors.textSecondary,
                fontSize: '14px',
                fontWeight: filter === option.key ? '600' : '500',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="review-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '160px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              borderRadius: '24px',
              border: '1px solid rgba(248, 113, 113, 0.2)',
            }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>
                😕
              </span>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: AppColors.error,
              }}>
                Something went wrong
              </p>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: AppColors.textSecondary,
              }}>
                {error}
              </p>
            </div>
          ) : itemCount === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: filter === 'mastered'
                ? 'rgba(255, 255, 255, 0.06)'
                : `${config.accentColor}10`,
              borderRadius: '24px',
              border: `1px solid ${filter === 'mastered' ? 'rgba(255, 255, 255, 0.08)' : config.accentColor}20`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative gradient */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-25%',
                width: '150%',
                height: '150%',
                background: `radial-gradient(ellipse at center, ${config.accentColor}10 0%, transparent 60%)`,
                pointerEvents: 'none',
              }} />

              <span style={{
                fontSize: '56px',
                display: 'block',
                marginBottom: '16px',
                position: 'relative',
              }}>
                {filter === 'mastered' ? '📦' : filter === 'all' ? '🎉' : '✨'}
              </span>
              <p style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: filter === 'mastered' ? AppColors.textSecondary : config.accentColor,
                position: 'relative',
              }}>
                {filter === 'mastered'
                  ? 'No mastered items yet'
                  : filter === 'all'
                    ? config.emptyMessage
                    : config.emptyMessage}
              </p>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '15px',
                color: AppColors.textSecondary,
                position: 'relative',
                lineHeight: 1.5,
              }}>
                {filter === 'mastered'
                  ? 'Mark items as mastered when you\'ve learned them.'
                  : config.emptySubtext}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
