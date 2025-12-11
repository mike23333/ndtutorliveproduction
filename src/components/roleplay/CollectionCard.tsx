import { AppColors, radius } from '../../theme/colors';
import { IllustrationPlaceholder } from './IllustrationPlaceholder';

interface CollectionCardProps {
  title: string;
  scenes: number;
  illustration: string;
  onClick?: () => void;
}

export function CollectionCard({ title, scenes, illustration, onClick }: CollectionCardProps) {
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
      <IllustrationPlaceholder type={illustration} size="large" />
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
          {scenes} Scenes
        </div>
      </div>
    </div>
  );
}
