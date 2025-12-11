import { AppColors } from '../../theme/colors';

interface IllustrationPlaceholderProps {
  type: string;
  size?: 'large' | 'small';
}

const illustrations: Record<string, { bg: string; emoji: string }> = {
  restaurant: { bg: AppColors.accentBlue, emoji: '🍽️' },
  travel: { bg: AppColors.accentBlue, emoji: '✈️' },
  interview: { bg: '#ff9f7f', emoji: '💼' },
  skills: { bg: AppColors.accentPurple, emoji: '📊' },
  date: { bg: AppColors.accentBlue, emoji: '💡' },
  romantic: { bg: AppColors.bgElevated, emoji: '🕯️' },
  directions: { bg: AppColors.accentBlue, emoji: '🚩' },
  pharmacy: { bg: AppColors.success, emoji: '💊' },
  shopping: { bg: AppColors.warning, emoji: '🛍️' },
  'restaurant-order': { bg: AppColors.accentBlue, emoji: '🍝' },
  hotel: { bg: AppColors.accentPurple, emoji: '🏨' },
  social: { bg: AppColors.success, emoji: '🥂' },
  neighbour: { bg: AppColors.accentBlue, emoji: '🏠' },
  default: { bg: AppColors.bgElevated, emoji: '📄' },
};

export function IllustrationPlaceholder({ type, size = 'large' }: IllustrationPlaceholderProps) {
  const ill = illustrations[type] || illustrations.default;

  return (
    <div
      style={{
        width: size === 'large' ? '100%' : '80px',
        height: size === 'large' ? '140px' : '80px',
        backgroundColor: ill.bg,
        borderRadius: size === 'large' ? '16px 16px 0 0' : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'large' ? '48px' : '32px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }}
      />
      {ill.emoji}
    </div>
  );
}
