import { AppColors, radius } from '../../theme/colors';

interface CreateScenarioBannerProps {
  onClick?: () => void;
}

export function CreateScenarioBanner({ onClick }: CreateScenarioBannerProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${AppColors.successMuted} 0%, rgba(96, 165, 250, 0.15) 100%)`,
        borderRadius: radius.lg,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${AppColors.success}33`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.01)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '24px',
          }}
        >
          🌿🎨
        </div>
        <div
          style={{
            fontWeight: '600',
            fontSize: '15px',
            color: AppColors.success,
          }}
        >
          Create your own scenario!
        </div>
      </div>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={AppColors.success}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}
