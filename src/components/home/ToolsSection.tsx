import React from 'react';
import { AppColors } from '../../theme/colors';
import { CreateOwnCard } from './CreateOwnCard';
import { PronunciationCard } from './PronunciationCard';

interface ToolsSectionProps {
  onCreateOwn: () => void;
  onPronunciationCoach: () => void;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  onCreateOwn,
  onPronunciationCoach,
}) => {
  return (
    <div
      style={{
        padding: '0 clamp(16px, 4vw, 24px)',
        marginTop: 'clamp(16px, 4vw, 24px)',
      }}
    >
      {/* Section title */}
      <h2
        style={{
          margin: '0 0 clamp(12px, 3vw, 16px) 0',
          fontSize: 'clamp(16px, 4vw, 20px)',
          fontWeight: 700,
          color: AppColors.textPrimary,
        }}
      >
        Quick Practice
      </h2>

      {/* Cards container - responsive layout */}
      <div
        style={{
          display: 'flex',
          gap: 'clamp(12px, 3vw, 16px)',
          flexWrap: 'wrap',
        }}
      >
        <CreateOwnCard onClick={onCreateOwn} />
        <PronunciationCard onClick={onPronunciationCoach} />
      </div>

      {/* Mobile stacking via CSS */}
      <style>{`
        @media (max-width: 600px) {
          .tools-section > div:last-child {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
