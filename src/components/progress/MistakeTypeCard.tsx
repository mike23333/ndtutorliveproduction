/**
 * Mistake Type Card
 * Shows count of mistakes for a specific error type
 * Tappable to navigate to detail page
 */

import { useNavigate } from 'react-router-dom';
import { AppColors } from '../../theme/colors';
import { ChevronRightIcon } from '../../theme/icons';
import { ReviewItemErrorType } from '../../types/firestore';

interface MistakeTypeCardProps {
  type: ReviewItemErrorType;
  count: number;
  newThisWeek: number;
}

const TYPE_CONFIG: Record<ReviewItemErrorType, { icon: string; label: string; route: string }> = {
  Pronunciation: { icon: '\u{1F399}', label: 'Pronunciation', route: '/progress/pronunciation' },
  Grammar: { icon: '\u{1F4DD}', label: 'Grammar', route: '/progress/grammar' },
  Vocabulary: { icon: '\u{1F4DA}', label: 'Vocabulary', route: '/progress/vocabulary' },
  Cultural: { icon: '\u{1F30D}', label: 'Cultural', route: '/progress/cultural' },
};

export default function MistakeTypeCard({ type, count, newThisWeek }: MistakeTypeCardProps) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[type];

  return (
    <button
      onClick={() => navigate(config.route)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: AppColors.surfaceMedium,
        borderRadius: '16px',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{config.icon}</span>
        <div>
          <div style={{
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: '600',
            color: AppColors.textPrimary,
            marginBottom: '2px',
          }}>
            {config.label}
          </div>
          <div style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}>
            {count} {count === 1 ? 'item' : 'items'}
            {newThisWeek > 0 && (
              <span style={{ color: AppColors.accentPurple }}>
                {' '}&middot; {newThisWeek} new
              </span>
            )}
          </div>
        </div>
      </div>
      <ChevronRightIcon size={20} color={AppColors.textSecondary} />
    </button>
  );
}
