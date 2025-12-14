/**
 * Pronunciation Review Page
 * Shows all pronunciation mistakes with audio playback options
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { ChevronLeftIcon, ChevronDownIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useMistakesOfType } from '../hooks/useMistakesByType';
import { MistakeCard } from '../components/progress';

type FilterType = 'all' | 'unmastered' | 'mastered';

export default function PronunciationReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('unmastered');
  const [filterOpen, setFilterOpen] = useState(false);

  const { items, loading, error } = useMistakesOfType(user?.uid, 'Pronunciation', filter);

  const filterLabels: Record<FilterType, string> = {
    all: 'All Items',
    unmastered: 'To Review',
    mastered: 'Mastered',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
        borderBottom: `1px solid ${AppColors.borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/progress')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: AppColors.textSecondary,
              cursor: 'pointer',
            }}
          >
            <ChevronLeftIcon size={24} />
          </button>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: '700',
            }}>
              {'\u{1F399}'} Pronunciation
            </h1>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: AppColors.textSecondary,
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: 'transparent',
              color: AppColors.textPrimary,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {filterLabels[filter]}
            <ChevronDownIcon size={16} />
          </button>

          {filterOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: AppColors.bgSecondary,
              borderRadius: '8px',
              border: `1px solid ${AppColors.borderColor}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 100,
              minWidth: '120px',
            }}>
              {(['unmastered', 'mastered', 'all'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setFilterOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    backgroundColor: f === filter ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: AppColors.textPrimary,
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: AppColors.textSecondary,
            padding: '40px 20px',
          }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            color: AppColors.errorRose,
            padding: '40px 20px',
          }}>
            Error loading items: {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>
              {filter === 'mastered' ? '\u{1F3C6}' : '\u{2728}'}
            </span>
            <p style={{
              margin: 0,
              color: AppColors.successGreen,
              fontWeight: '600',
              fontSize: '16px',
            }}>
              {filter === 'mastered'
                ? 'No mastered items yet'
                : 'No pronunciation mistakes!'}
            </p>
            <p style={{
              margin: '8px 0 0 0',
              color: AppColors.textSecondary,
              fontSize: '14px',
            }}>
              {filter === 'mastered'
                ? 'Mark items as mastered when you\'ve learned them.'
                : 'Keep up the great work!'}
            </p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <MistakeCard
                key={item.id}
                item={item}
                userId={user?.uid || ''}
                showAudioButtons={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
