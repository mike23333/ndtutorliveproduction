import React, { useRef, useEffect, useState } from 'react';
import { AppColors } from '../../../theme/colors';

interface CollapsibleSectionProps {
  title: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  stepNumber: 1 | 2 | 3;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  summary,
  expanded,
  onToggle,
  children,
  stepNumber,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded]);

  return (
    <div
      style={{
        marginBottom: 'clamp(12px, 3vw, 16px)',
        background: expanded ? AppColors.surfaceLight : 'transparent',
        border: `1px solid ${expanded ? AppColors.borderHover : AppColors.borderColor}`,
        borderRadius: 'clamp(10px, 2.5vw, 14px)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(14px, 3.5vw, 18px)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: expanded ? 0 : '4px',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${AppColors.accentPurple}30, ${AppColors.accentBlue}30)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: AppColors.textSecondary,
              }}
            >
              {stepNumber}
            </span>
            <span
              style={{
                fontSize: 'clamp(14px, 3vw, 15px)',
                fontWeight: 600,
                color: AppColors.textPrimary,
              }}
            >
              {title}
            </span>
          </div>
          {!expanded && summary && (
            <p
              style={{
                margin: '0 0 0 34px',
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {summary}
            </p>
          )}
        </div>

        {/* Chevron */}
        <span
          style={{
            fontSize: '16px',
            color: AppColors.textSecondary,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            marginLeft: '12px',
          }}
        >
          ▼
        </span>
      </button>

      {/* Content */}
      <div
        style={{
          height: expanded ? contentHeight : 0,
          overflow: 'hidden',
          transition: 'height 200ms ease-out',
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: expanded ? '0 clamp(14px, 3.5vw, 18px) clamp(14px, 3.5vw, 18px)' : '0',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
