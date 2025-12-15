/**
 * EmptyState - Shared Empty State Component
 * Premium styling with floating animation and gradient text
 */

import { AppColors, radius } from '../../theme/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
      }}
    >
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .empty-state-icon {
          animation: floatIcon 3s ease-in-out infinite;
        }
        .empty-state-action {
          transition: all 200ms ease;
        }
        .empty-state-action:hover {
          background: linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(168, 85, 247, 0.3);
        }
      `}</style>

      {/* Floating icon */}
      <div
        className="empty-state-icon"
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.12) 0%, rgba(96, 165, 250, 0.08) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
        }}
      >
        {icon}
      </div>

      {/* Title with gradient */}
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}
      >
        {title}
      </h3>

      {/* Message */}
      <p
        style={{
          margin: '0 0 24px 0',
          fontSize: '15px',
          color: AppColors.textSecondary,
          lineHeight: 1.5,
          maxWidth: '280px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {message}
      </p>

      {/* Action button */}
      {action && (
        <button
          className="empty-state-action"
          onClick={action.onClick}
          style={{
            padding: '12px 24px',
            borderRadius: radius.md,
            border: 'none',
            background: 'linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%)',
            color: '#1a0a2e',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
