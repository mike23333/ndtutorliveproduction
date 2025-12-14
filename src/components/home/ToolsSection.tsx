/**
 * Tools Section - Premium Quick Practice Tools
 * Glass-morphic design matching Progress page aesthetic
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { CreateOwnCard } from './CreateOwnCard';
import { PronunciationCard } from './PronunciationCard';

interface ToolsSectionProps {
  onCreateOwn: () => void;
  onPronunciationCoach: () => void;
}

/**
 * Tools Section - Premium quick practice tools
 * Features: glass-morphic container, animated header, staggered card animations
 */
export const ToolsSection: React.FC<ToolsSectionProps> = ({
  onCreateOwn,
  onPronunciationCoach,
}) => {
  return (
    <section
      style={{
        padding: '0 20px',
        marginBottom: '24px',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tools-header {
          animation: fadeSlideUp 0.5s ease-out;
        }
        .tools-card-1 {
          animation: fadeSlideUp 0.5s ease-out 0.1s both;
        }
        .tools-card-2 {
          animation: fadeSlideUp 0.5s ease-out 0.2s both;
        }
      `}</style>

      {/* Section Header - clean and minimal like Progress page */}
      <div
        className="tools-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.3px',
          }}
        >
          Quick Practice
        </h2>
        <span
          style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
            fontWeight: '500',
          }}
        >
          Anytime
        </span>
      </div>

      {/* Premium 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        <div className="tools-card-1">
          <CreateOwnCard onClick={onCreateOwn} />
        </div>
        <div className="tools-card-2">
          <PronunciationCard onClick={onPronunciationCoach} />
        </div>
      </div>
    </section>
  );
};
