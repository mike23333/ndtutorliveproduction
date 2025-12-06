/**
 * VocabTracker Component
 * Displays target vocabulary words and their usage status
 */

import React from 'react';
import { AppColors } from '../../theme/colors';

export interface VocabWord {
  word: string;
  used: boolean;
}

interface VocabTrackerProps {
  words: VocabWord[];
}

export const VocabTracker: React.FC<VocabTrackerProps> = ({ words }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    flexWrap: 'wrap',
  }}>
    <span style={{ fontSize: '12px', color: AppColors.textSecondary }}>Target vocab:</span>
    {words.map((v, i) => (
      <span key={i} style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: v.used ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.1)',
        color: v.used ? AppColors.successGreen : AppColors.textSecondary,
        border: `1px solid ${v.used ? 'rgba(74, 222, 128, 0.3)' : 'transparent'}`,
      }}>
        {v.word} {v.used && '✓'}
      </span>
    ))}
  </div>
);

export default VocabTracker;
