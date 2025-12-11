import React from 'react';
import { AppColors } from '../../theme/colors';
import { CreateOwnCard } from './CreateOwnCard';
import { PronunciationCard } from './PronunciationCard';

interface ToolsSectionProps {
  onCreateOwn: () => void;
  onPronunciationCoach: () => void;
}

/**
 * Tools Section - Quick practice tools
 * Clean 2-column layout
 */
export const ToolsSection: React.FC<ToolsSectionProps> = ({
  onCreateOwn,
  onPronunciationCoach,
}) => {
  return (
    <section style={{ padding: '0 20px', marginBottom: '24px' }}>
      {/* Header */}
      <h2
        style={{
          margin: '0 0 12px 0',
          fontSize: '17px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}
      >
        Quick Practice
      </h2>

      {/* 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        <CreateOwnCard onClick={onCreateOwn} />
        <PronunciationCard onClick={onPronunciationCoach} />
      </div>
    </section>
  );
};
