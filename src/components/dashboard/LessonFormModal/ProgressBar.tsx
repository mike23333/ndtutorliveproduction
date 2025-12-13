import React from 'react';
import { AppColors } from '../../../theme/colors';

interface ProgressBarProps {
  progress: 33 | 66 | 100;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Step ${progress === 33 ? 1 : progress === 66 ? 2 : 3} of 3`}
      style={{
        width: '100%',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '1.5px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${AppColors.accentPurple}, ${AppColors.accentBlue})`,
          borderRadius: '1.5px',
          transition: 'width 300ms ease-out',
        }}
      />
    </div>
  );
};
