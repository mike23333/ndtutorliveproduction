/**
 * Star Animation Component
 * Displays an animated session summary with star rating
 */

import React, { useState, useEffect } from 'react';
import type { ShowSessionSummaryParams } from '../../types/functions';
import '../../styles/animations.css';

interface StarAnimationProps {
  /** Session summary data from Gemini */
  summary: ShowSessionSummaryParams;
  /** Called when user dismisses the modal */
  onContinue: () => void;
  /** Whether the modal is visible */
  isVisible: boolean;
  /** MED-005: Loading state for save operation */
  isLoading?: boolean;
}

/**
 * Single animated star component
 * MED-008: Removed unused index parameter
 */
const AnimatedStar: React.FC<{
  filled: boolean;
  delay: number;
}> = ({ filled, delay }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`star ${isAnimated ? 'animated' : ''} ${filled ? 'filled' : 'empty'}`}
      style={{
        transform: isAnimated ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
        opacity: isAnimated ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill={filled ? '#fbbf24' : 'none'}
        stroke={filled ? '#fbbf24' : '#6b7280'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {filled && isAnimated && (
        <div className="star-sparkle" style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24">
            <path d="M12 0L14 10L12 8L10 10L12 0Z" />
            <path d="M24 12L14 10L16 12L14 14L24 12Z" />
            <path d="M12 24L10 14L12 16L14 14L12 24Z" />
            <path d="M0 12L10 14L8 12L10 10L0 12Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Confetti particle for celebration effect
 */
const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 2 + Math.random() * 2;
  const size = 8 + Math.random() * 8;

  return (
    <div
      className="confetti"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
        animation: `fall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
};

export const StarAnimation: React.FC<StarAnimationProps> = ({
  summary,
  onContinue,
  isVisible,
  isLoading = false,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show content after stars animation
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 800 + summary.stars * 200);

      // Show button after content
      const buttonTimer = setTimeout(() => {
        setShowButton(true);
      }, 1200 + summary.stars * 200);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(buttonTimer);
      };
    } else {
      setShowContent(false);
      setShowButton(false);
    }
  }, [isVisible, summary.stars]);

  if (!isVisible) return null;

  const starCount = Math.min(5, Math.max(1, summary.stars));

  return (
    <div className="star-animation-overlay">
      {/* Confetti for 4+ stars */}
      {starCount >= 4 && (
        <div className="confetti-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      <div className="star-animation-modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="session-complete-title">Session Complete!</h2>
        </div>

        {/* Stars */}
        <div className="stars-container">
          {Array.from({ length: 5 }).map((_, i) => (
            <AnimatedStar
              key={i}
              filled={i < starCount}
              delay={200 + i * 150}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className={`summary-content ${showContent ? 'visible' : ''}`}
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease-out',
          }}
        >
          {/* Summary text */}
          <p className="summary-text">{summary.summary_text}</p>

          {/* Did well section */}
          {summary.did_well.length > 0 && (
            <div className="feedback-section did-well">
              <h3>
                <span className="icon">✅</span> What you did well
              </h3>
              <ul>
                {summary.did_well.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Work on section */}
          {summary.work_on.length > 0 && (
            <div className="feedback-section work-on">
              <h3>
                <span className="icon">📝</span> Keep practicing
              </h3>
              <ul>
                {summary.work_on.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Encouragement */}
          <p className="encouragement">{summary.encouragement}</p>
        </div>

        {/* Continue button - MED-005: with loading state */}
        <button
          className={`continue-button ${showButton ? 'visible' : ''}`}
          onClick={onContinue}
          disabled={isLoading}
          style={{
            opacity: showButton ? (isLoading ? 0.7 : 1) : 0,
            transform: showButton ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease-out',
            pointerEvents: showButton && !isLoading ? 'auto' : 'none',
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>

      <style>{`
        .star-animation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        /* MED-001: fall and fadeIn keyframes moved to animations.css */

        .star-animation-modal {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 24px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .session-complete-title {
          font-size: 28px;
          font-weight: bold;
          color: white;
          margin: 0;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stars-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .star {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .star.filled svg {
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
        }

        .summary-content {
          color: white;
        }

        .summary-text {
          font-size: 16px;
          line-height: 1.6;
          color: #e2e8f0;
          text-align: center;
          margin-bottom: 24px;
        }

        .feedback-section {
          margin-bottom: 20px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
        }

        .feedback-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feedback-section.did-well h3 {
          color: #34d399;
        }

        .feedback-section.work-on h3 {
          color: #60a5fa;
        }

        .feedback-section ul {
          margin: 0;
          padding-left: 24px;
          color: #cbd5e1;
        }

        .feedback-section li {
          margin-bottom: 6px;
          line-height: 1.5;
        }

        .encouragement {
          font-size: 18px;
          font-weight: 500;
          color: #fbbf24;
          text-align: center;
          margin: 24px 0;
          padding: 16px;
          background: rgba(251, 191, 36, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .continue-button {
          display: block;
          width: 100%;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .continue-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(251, 191, 36, 0.4);
        }

        .continue-button:active {
          transform: translateY(0);
        }

        /* MED-001: pulse-glow keyframes moved to animations.css */
      `}</style>
    </div>
  );
};

export default StarAnimation;
