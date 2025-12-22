/**
 * Session Timer Component
 * Displays a circular countdown timer for session duration
 */

import React, { useState, useEffect, useRef } from 'react';
import { TIMER_LOW_TIME_SECONDS, TIMER_CRITICAL_SECONDS, TIMER_RADIUS } from '../../constants/chat';
import { logger } from '../../utils/logger';
import '../../styles/animations.css';

interface SessionTimerProps {
  /** Duration in minutes */
  durationMinutes: number;
  /** Called when timer reaches zero */
  onTimeUp: () => void;
  /** Whether the session is paused */
  isPaused?: boolean;
  /** Whether to show the timer (hidden during summary) */
  isVisible?: boolean;
  /** Custom className for positioning */
  className?: string;
}

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get color based on time remaining
 */
function getTimerColor(secondsRemaining: number, totalSeconds: number): string {
  const percentage = secondsRemaining / totalSeconds;

  if (percentage > 0.5) return '#10b981'; // green
  if (percentage > 0.25) return '#f59e0b'; // amber
  if (percentage > 0.1) return '#f97316'; // orange
  return '#ef4444'; // red
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  durationMinutes,
  onTimeUp,
  isPaused = false,
  isVisible = true,
  className = '',
}) => {
  const totalSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const hasTriggeredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // MED-007: Use ref to avoid stale closure in timeout callback
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Calculate progress for circular display
  const progress = secondsRemaining / totalSeconds;
  const circumference = 2 * Math.PI * TIMER_RADIUS;
  const strokeDashoffset = circumference * (1 - progress);
  const color = getTimerColor(secondsRemaining, totalSeconds);

  // Timer countdown logic
  useEffect(() => {
    if (isPaused || secondsRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, secondsRemaining]);

  // Trigger onTimeUp when timer reaches zero
  // MED-007: Use ref to avoid stale closure and remove onTimeUp from deps
  useEffect(() => {
    if (secondsRemaining === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onTimeUpRef.current();
    }
  }, [secondsRemaining]);

  // Reset trigger flag if timer resets
  useEffect(() => {
    if (secondsRemaining === totalSeconds) {
      hasTriggeredRef.current = false;
    }
  }, [secondsRemaining, totalSeconds]);

  if (!isVisible) {
    return null;
  }

  const isLowTime = secondsRemaining <= TIMER_LOW_TIME_SECONDS;
  const isCritical = secondsRemaining <= TIMER_CRITICAL_SECONDS;

  return (
    <div
      className={`session-timer ${className} ${isLowTime ? 'low-time' : ''} ${isCritical ? 'critical' : ''}`}
      role="timer"
      aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="timer-circle"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
          }}
        />
        {/* Timer text */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {formatTime(secondsRemaining)}
        </text>
        {/* Status text */}
        {isPaused && (
          <text
            x="50"
            y="68"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="10"
          >
            PAUSED
          </text>
        )}
      </svg>

      {/* Pulse animation for low time */}
      {isCritical && (
        <div
          className="pulse-ring"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* MED-001: Keyframes moved to animations.css */}
      <style>{`
        .session-timer {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .session-timer.low-time .timer-circle {
          animation: shake 0.5s ease-in-out;
        }

        .session-timer.critical .timer-circle {
          animation: pulse-scale 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Compact version for smaller displays
 */
export const SessionTimerCompact: React.FC<SessionTimerProps> = ({
  durationMinutes,
  onTimeUp,
  isPaused = false,
  isVisible = true,
  className = '',
}) => {
  const totalSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const hasTriggeredRef = useRef(false);
  const initializedRef = useRef(false);
  // MED-007: Use ref to avoid stale closure in timeout callback
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Only initialize once - don't reset on re-renders
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setSecondsRemaining(totalSeconds);
    }
  }, [totalSeconds]);

  // Timer countdown - only run when not paused and not finished
  useEffect(() => {
    // Don't run if paused, already triggered, or at zero
    if (isPaused || hasTriggeredRef.current || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsRemaining]);

  // Trigger onTimeUp exactly once when timer reaches zero
  // MED-007: Use ref to avoid stale closure and remove onTimeUp from deps
  useEffect(() => {
    if (secondsRemaining === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      logger.info('[SessionTimer]', 'Time up! Calling onTimeUp callback');
      onTimeUpRef.current();
    }
  }, [secondsRemaining]);

  if (!isVisible) return null;

  const color = getTimerColor(secondsRemaining, totalSeconds);
  const isLowTime = secondsRemaining <= TIMER_LOW_TIME_SECONDS;

  return (
    <div
      className={`timer-compact ${className} ${isLowTime ? 'low-time' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1vw, 6px)',
        padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 12px)',
        borderRadius: 'clamp(14px, 4vw, 20px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 'clamp(11px, 3vw, 14px)',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      role="timer"
      aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
    >
      <span
        style={{
          width: 'clamp(6px, 2vw, 10px)',
          height: 'clamp(6px, 2vw, 10px)',
          borderRadius: '50%',
          backgroundColor: color,
          animation: isLowTime ? 'blink 0.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      />
      <span style={{ color }}>{formatTime(secondsRemaining)}</span>
      {isPaused && <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', opacity: 0.7 }}>⏸</span>}
      {/* MED-001: blink keyframes moved to animations.css */}
    </div>
  );
};

export default SessionTimer;
