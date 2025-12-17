/**
 * Install App Button for Settings/Profile
 * A menu-style button that appears in settings for users who dismissed the prompt
 * or want to install later
 */

import { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { ChevronRightIcon } from '../../theme/icons';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export function InstallAppButton() {
  const {
    isIOS,
    canShowInstallInSettings,
    triggerInstall,
  } = usePWAInstall();

  const [showIOSModal, setShowIOSModal] = useState(false);

  if (!canShowInstallInSettings) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    await triggerInstall();
  };

  return (
    <>
      <button
        className="menu-button"
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          backgroundColor: 'transparent',
          color: AppColors.textPrimary,
          fontSize: '15px',
          fontWeight: '500',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '18px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span>Install App</span>
        </div>
        <ChevronRightIcon size={20} color={AppColors.textSecondary} />
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
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
          onClick={() => setShowIOSModal(false)}
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
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
              onClick={() => setShowIOSModal(false)}
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
      )}
    </>
  );
}

export default InstallAppButton;
