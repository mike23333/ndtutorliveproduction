/**
 * Mistake Card - Redesigned
 * Premium card for displaying review items
 * Features: Glass-morphism, severity indicator, smooth animations
 */

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppColors } from '../../theme/colors';
import { ReviewItemDocument } from '../../types/firestore';
import { CheckIcon, PlayIcon } from '../../theme/icons';

interface MistakeCardProps {
  item: ReviewItemDocument;
  userId: string;
  showAudioButtons?: boolean;
  index?: number; // For staggered animation
}

// Severity configuration
const getSeverityConfig = (severity: number) => {
  if (severity <= 3) return { color: '#4ade80', label: 'Minor', bg: 'rgba(74, 222, 128, 0.15)' };
  if (severity <= 6) return { color: '#fbbf24', label: 'Moderate', bg: 'rgba(251, 191, 36, 0.15)' };
  if (severity <= 8) return { color: '#fb923c', label: 'Notable', bg: 'rgba(251, 146, 60, 0.15)' };
  return { color: '#f87171', label: 'Important', bg: 'rgba(248, 113, 113, 0.15)' };
};

function formatDate(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MistakeCard({
  item,
  userId,
  showAudioButtons = false,
  index = 0,
}: MistakeCardProps) {
  const [mastered, setMastered] = useState(item.mastered);
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const severityConfig = getSeverityConfig(item.severity);

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
    <div
      className="card-animate"
      style={{
        backgroundColor: mastered
          ? 'rgba(255, 255, 255, 0.04)'
          : 'rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        opacity: mastered ? 0.7 : 1,
        transition: 'all 0.3s ease',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Main content */}
      <div
        style={{
          padding: '20px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Top row: User sentence + severity */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {/* User's sentence */}
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '500',
              color: AppColors.textPrimary,
              lineHeight: 1.5,
            }}>
              "{item.userSentence}"
            </p>
          </div>

          {/* Severity badge */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: severityConfig.bg,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: severityConfig.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {severityConfig.label}
            </span>
          </div>
        </div>

        {/* Correction */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '14px 16px',
          backgroundColor: 'rgba(74, 222, 128, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(74, 222, 128, 0.15)',
        }}>
          <span style={{
            fontSize: '16px',
            marginTop: '1px',
          }}>✓</span>
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: AppColors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '4px',
            }}>
              Correct
            </span>
            <p style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '500',
              color: AppColors.successGreen,
              lineHeight: 1.4,
            }}>
              "{item.correction}"
            </p>
          </div>
        </div>

        {/* Expandable explanation */}
        {item.explanation && (
          <div style={{
            marginTop: '16px',
            maxHeight: expanded ? '200px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}>
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: AppColors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '8px',
              }}>
                💡 Explanation
              </span>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: AppColors.textSecondary,
                lineHeight: 1.6,
              }}>
                {item.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Expand hint */}
        {item.explanation && !expanded && (
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              color: AppColors.textMuted,
            }}>
              Tap for explanation
            </span>
          </div>
        )}
      </div>

      {/* Audio buttons (pronunciation only) */}
      {showAudioButtons && (
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '0 20px 16px 20px',
        }}>
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: AppColors.textSecondary,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Play user's audio
            }}
          >
            <PlayIcon size={14} />
            Your recording
          </button>
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              backgroundColor: 'rgba(74, 222, 128, 0.08)',
              color: AppColors.successGreen,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Play TTS correction
            }}
          >
            <PlayIcon size={14} />
            Correct way
          </button>
        </div>
      )}

      {/* Footer: Mastered toggle + date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
      }}>
        {/* Mastered toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMasteredToggle();
          }}
          disabled={updating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderRadius: '10px',
            border: mastered
              ? `1px solid ${AppColors.successGreen}40`
              : '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: mastered
              ? 'rgba(74, 222, 128, 0.15)'
              : 'rgba(255, 255, 255, 0.04)',
            color: mastered ? AppColors.successGreen : AppColors.textSecondary,
            fontSize: '13px',
            fontWeight: '500',
            cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            backgroundColor: mastered ? AppColors.successGreen : 'transparent',
            border: mastered ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            {mastered && <CheckIcon size={14} color="#1e1b4b" />}
          </div>
          {mastered ? 'Mastered' : 'Mark mastered'}
        </button>

        {/* Date */}
        <span style={{
          fontSize: '12px',
          color: AppColors.textMuted,
        }}>
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
