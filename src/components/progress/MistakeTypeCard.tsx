/**
 * Mistake Type Card - Redesigned
 * Premium glass-morphic cards with gradient accents
 * Each category has a distinct visual identity
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

const TYPE_CONFIG: Record<ReviewItemErrorType, {
  icon: string;
  label: string;
  route: string;
  gradient: string;
  accentColor: string;
  glowColor: string;
}> = {
  Pronunciation: {
    icon: '🎯',
    label: 'Pronunciation',
    route: '/progress/pronunciation',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
    accentColor: '#a78bfa',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  },
  Grammar: {
    icon: '📝',
    label: 'Grammar',
    route: '/progress/grammar',
    gradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 100%)',
    accentColor: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.3)',
  },
  Vocabulary: {
    icon: '📚',
    label: 'Vocabulary',
    route: '/progress/vocabulary',
    gradient: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%)',
    accentColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.3)',
  },
  Cultural: {
    icon: '🌍',
    label: 'Cultural',
    route: '/progress/cultural',
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.3)',
  },
};

export default function MistakeTypeCard({ type, count, newThisWeek }: MistakeTypeCardProps) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[type];

  return (
    <button
      onClick={() => navigate(config.route)}
      className="mistake-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '20px',
        background: config.gradient,
        borderRadius: '20px',
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 250ms ease',
      }}
    >
      <style>{`
        .mistake-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .mistake-card:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Accent glow */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: config.glowColor,
        filter: 'blur(30px)',
        opacity: 0.5,
      }} />

      {/* Icon container */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '14px',
        fontSize: '22px',
        boxShadow: `0 4px 12px ${config.glowColor}`,
      }}>
        {config.icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '15px',
        fontWeight: '600',
        color: AppColors.textPrimary,
        marginBottom: '4px',
      }}>
        {config.label}
      </div>

      {/* Count row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px',
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: config.accentColor,
          }}>
            {count}
          </span>
          <span style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
          }}>
            {count === 1 ? 'item' : 'items'}
          </span>
        </div>

        <ChevronRightIcon size={18} color={AppColors.textSecondary} />
      </div>

      {/* New this week badge */}
      {newThisWeek > 0 && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 10px',
          borderRadius: '12px',
          backgroundColor: config.accentColor,
          fontSize: '11px',
          fontWeight: '600',
          color: '#1e1b4b',
        }}>
          +{newThisWeek} new
        </div>
      )}
    </button>
  );
}
