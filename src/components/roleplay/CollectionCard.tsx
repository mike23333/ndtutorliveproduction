import { AppColors, radius } from '../../theme/colors';
import { IllustrationPlaceholder } from './IllustrationPlaceholder';

interface CollectionCardProps {
  title: string;
  scenes: number;
  illustration?: string;
  imageUrl?: string; // Firebase Storage URL
  color?: string; // Theme color for fallback
  onClick?: () => void;
}

export function CollectionCard({ title, scenes, illustration, imageUrl, color: _color, onClick }: CollectionCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.xl,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${AppColors.borderColor}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.3)`;
        e.currentTarget.style.borderColor = AppColors.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = AppColors.borderColor;
      }}
    >
      {/* Use real image if provided, otherwise fall back to illustration placeholder */}
      {imageUrl ? (
        <div
          style={{
            width: '100%',
            height: '140px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Gradient overlay for better text readability */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
            }}
          />
        </div>
      ) : (
        <IllustrationPlaceholder type={illustration || 'default'} size="large" />
      )}
      <div style={{ padding: '16px' }}>
        <div
          style={{
            fontWeight: '600',
            fontSize: '17px',
            color: AppColors.textPrimary,
            marginBottom: '4px',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: '13px', color: AppColors.textSecondary }}>
          {scenes} {scenes === 1 ? 'Lesson' : 'Lessons'}
        </div>
      </div>
    </div>
  );
}
