import { AppColors, radius } from '../../theme/colors';

interface LevelCardProps {
  icon: string;
  title: string;
  scenes: number;
  onClick?: () => void;
}

export function LevelCard({ icon, title, scenes, onClick }: LevelCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.lg,
        padding: '16px',
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
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div
        style={{
          fontWeight: '600',
          fontSize: '15px',
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
  );
}
