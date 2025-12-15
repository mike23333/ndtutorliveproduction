import React from 'react';
import { PlusIcon } from '../../theme/icons';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = 'New Lesson',
}) => {
  return (
    <>
      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6); }
        }
        .fab-button:hover {
          transform: scale(1.05);
        }
        .fab-button:active {
          transform: scale(0.95);
        }
        @media (min-width: 640px) {
          .fab-container { display: none !important; }
        }
      `}</style>
      <div
        className="fab-container"
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        {/* Tooltip label */}
        <div
          style={{
            background: 'rgba(30, 27, 75, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            whiteSpace: 'nowrap',
            opacity: 0.9,
          }}
        >
          {label}
        </div>

        {/* FAB Button */}
        <button
          className="fab-button"
          onClick={onClick}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            animation: 'fab-pulse 2s ease-in-out infinite',
          }}
          aria-label={label}
        >
          <PlusIcon size={28} color="#ffffff" />
        </button>
      </div>
    </>
  );
};
