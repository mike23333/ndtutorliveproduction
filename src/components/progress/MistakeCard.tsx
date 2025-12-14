/**
 * Mistake Card
 * Displays a single review item with correction and explanation
 */

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppColors } from '../../theme/colors';
import { ReviewItemDocument } from '../../types/firestore';

interface MistakeCardProps {
  item: ReviewItemDocument;
  userId: string;
  showAudioButtons?: boolean; // For future TTS implementation
}

// Severity colors (subtle)
const SEVERITY_COLORS: Record<number, string> = {
  1: '#4ade80', // Green - minor
  2: '#4ade80',
  3: '#4ade80',
  4: '#fbbf24', // Yellow - moderate
  5: '#fbbf24',
  6: '#fbbf24',
  7: '#fb923c', // Orange - significant
  8: '#fb923c',
  9: '#f87171', // Red - critical
  10: '#f87171',
};

function getSeverityColor(severity: number): string {
  return SEVERITY_COLORS[Math.min(10, Math.max(1, severity))] || SEVERITY_COLORS[5];
}

function formatDate(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MistakeCard({
  item,
  userId,
  showAudioButtons = false
}: MistakeCardProps) {
  const [mastered, setMastered] = useState(item.mastered);
  const [updating, setUpdating] = useState(false);

  const handleMasteredToggle = async () => {
    if (updating || !db) return;

    setUpdating(true);
    const newMastered = !mastered;

    try {
      const itemRef = doc(db!, 'users', userId, 'reviewItems', item.id);
      await updateDoc(itemRef, {
        mastered: newMastered,
        ...(newMastered ? { masteredAt: Timestamp.now() } : { masteredAt: null }),
      });
      setMastered(newMastered);
    } catch (error) {
      console.error('Error updating mastered status:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      backgroundColor: AppColors.surfaceMedium,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      opacity: mastered ? 0.6 : 1,
      transition: 'opacity 0.2s ease',
    }}>
      {/* Header with severity indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        {/* User's sentence */}
        <div style={{
          flex: 1,
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          color: AppColors.textPrimary,
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          "{item.userSentence}"
        </div>

        {/* Severity dot */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: getSeverityColor(item.severity),
          marginLeft: '12px',
          marginTop: '4px',
          flexShrink: 0,
        }} />
      </div>

      {/* Correction */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '12px',
          color: AppColors.textSecondary,
          marginBottom: '4px',
        }}>
          Correction:
        </div>
        <div style={{
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          color: AppColors.successGreen,
          fontWeight: '500',
        }}>
          "{item.correction}"
        </div>
      </div>

      {/* Explanation */}
      {item.explanation && (
        <div style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: AppColors.textSecondary,
          lineHeight: 1.5,
          marginBottom: '12px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
        }}>
          {item.explanation}
        </div>
      )}

      {/* Audio buttons - placeholder for future TTS */}
      {showAudioButtons && item.audioUrl && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: 'transparent',
              color: AppColors.textSecondary,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {'\u25B6'} How you said it
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: 'transparent',
              color: AppColors.textSecondary,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {'\u25B6'} Correct way
          </button>
        </div>
      )}

      {/* Footer: Mastered toggle + date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: `1px solid ${AppColors.borderColor}`,
      }}>
        {/* Mastered checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: updating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          color: mastered ? AppColors.successGreen : AppColors.textSecondary,
        }}>
          <input
            type="checkbox"
            checked={mastered}
            onChange={handleMasteredToggle}
            disabled={updating}
            style={{
              width: '18px',
              height: '18px',
              accentColor: AppColors.successGreen,
              cursor: updating ? 'not-allowed' : 'pointer',
            }}
          />
          {mastered ? 'Mastered' : 'Mark as mastered'}
        </label>

        {/* Date */}
        <span style={{
          fontSize: '12px',
          color: AppColors.textSecondary,
        }}>
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
