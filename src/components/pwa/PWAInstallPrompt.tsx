/**
 * PWA Install Prompt Component
 * A dismissible bottom sheet/snackbar that appears above the nav bar
 * Shows on mobile for first 2-3 visits to encourage app installation
 */

import { useState, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  bottomOffset?: number; // Offset from bottom (for nav bar)
}

export function PWAInstallPrompt({ bottomOffset = 80 }: PWAInstallPromptProps) {
  const {
    shouldShowPrompt,
    isIOS,
    triggerInstall,
    dismissPrompt,
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Animate in after mount
  useEffect(() => {
    if (shouldShowPrompt) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissPrompt();
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS-specific instructions
      setShowIOSInstructions(true);
      return;
    }

    const result = await triggerInstall();
    if (result.success) {
      handleDismiss();
    }
  };

  if (!shouldShowPrompt && !isVisible) return null;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setShowIOSInstructions(false)}
      >
        <div
          style={{
            backgroundColor: AppColors.bgSecondary,
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '320px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            textAlign: 'center',
          }}>
            Install AI English Tutor
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: AppColors.accent,
                flexShrink: 0,
              }}>1</span>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: AppColors.textSecondary,
              }}>
                Tap the <strong style={{ color: AppColors.textPrimary }}>Share</strong> button
                <span style={{ marginLeft: '6px', fontSize: '16px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: AppColors.accent,
                flexShrink: 0,
              }}>2</span>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: AppColors.textSecondary,
              }}>
                Scroll down and tap <strong style={{ color: AppColors.textPrimary }}>Add to Home Screen</strong>
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: AppColors.accent,
                flexShrink: 0,
              }}>3</span>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: AppColors.textSecondary,
              }}>
                Tap <strong style={{ color: AppColors.textPrimary }}>Add</strong> to install
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIOSInstructions(false);
              handleDismiss();
            }}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: AppColors.accent,
              color: '#1e1b4b',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUpPWA {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDownPWA {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          left: '12px',
          right: '12px',
          bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
          zIndex: 50,
          animation: isAnimatingOut
            ? 'slideDownPWA 0.3s ease-out forwards'
            : 'slideUpPWA 0.4s ease-out forwards',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(30, 27, 75, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* App Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
          >
            <span style={{
              fontSize: '18px',
              fontWeight: '800',
              color: 'white',
            }}>AI</span>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: AppColors.textPrimary,
              lineHeight: 1.3,
            }}>
              Install App
            </p>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              color: AppColors.textSecondary,
              lineHeight: 1.3,
            }}>
              Get faster access & offline mode
            </p>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstall}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
            }}
          >
            {isIOS ? 'How?' : 'Install'}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: AppColors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default PWAInstallPrompt;
