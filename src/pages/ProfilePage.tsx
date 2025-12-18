/**
 * Profile Page - Redesigned
 * Premium profile with stunning visuals and engaging interactions
 */

import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { ChevronLeftIcon, ChevronRightIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useBadgeProgress } from '../hooks/useBadges';
import { LearningSettingsCard } from '../components/profile';
import { SubscriptionCard } from '../components/profile/SubscriptionCard';
import { InstallAppButton } from '../components/pwa';
import { useState, useEffect, useRef } from 'react';
import { getUserStarStats } from '../services/firebase/sessionData';
import { signOut, updateUserProfile } from '../services/firebase/auth';
import { uploadProfilePhoto } from '../services/firebase/storage';

interface UserStats {
  totalSessions: number;
  totalStars: number;
  longestStreak: number;
}

// Level configuration with gradient colors
const LEVEL_CONFIG: Record<string, {
  gradient: string;
  glow: string;
  label: string;
  description: string;
}> = {
  'A1': {
    gradient: 'linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)',
    glow: 'rgba(134, 239, 172, 0.3)',
    label: 'Beginner',
    description: 'Starting your journey',
  },
  'A2': {
    gradient: 'linear-gradient(135deg, #86EFAC 0%, #16A34A 100%)',
    glow: 'rgba(134, 239, 172, 0.3)',
    label: 'Elementary',
    description: 'Building foundations',
  },
  'B1': {
    gradient: 'linear-gradient(135deg, #FDE047 0%, #EAB308 100%)',
    glow: 'rgba(253, 224, 71, 0.3)',
    label: 'Intermediate',
    description: 'Growing confidence',
  },
  'B2': {
    gradient: 'linear-gradient(135deg, #FDBA74 0%, #EA580C 100%)',
    glow: 'rgba(253, 186, 116, 0.3)',
    label: 'Upper Intermediate',
    description: 'Expanding horizons',
  },
  'C1': {
    gradient: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)',
    glow: 'rgba(196, 181, 253, 0.3)',
    label: 'Advanced',
    description: 'Near-native fluency',
  },
  'C2': {
    gradient: 'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)',
    glow: 'rgba(249, 168, 212, 0.3)',
    label: 'Mastery',
    description: 'Language expert',
  },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const { earnedBadges } = useBadgeProgress(user?.uid);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    totalStars: 0,
    longestStreak: 0,
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;
      try {
        const stats = await getUserStarStats(user.uid);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };
    fetchStats();
  }, [user?.uid]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoggingOut(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setPhotoError('');
    setUploadingPhoto(true);

    try {
      const photoURL = await uploadProfilePhoto(file, user.uid);
      await updateUserProfile(user.uid, { photoURL });
      window.location.reload();
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      setPhotoError((error as Error).message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const userLevel = userDocument?.level || 'B1';
  const levelConfig = LEVEL_CONFIG[userLevel] || LEVEL_CONFIG['B1'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .menu-button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .profile-content::-webkit-scrollbar { width: 0; display: none; }
        .profile-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .profile-content { max-width: 540px; margin: 0 auto; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="profile-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Hero Section */}
        <div style={{
          position: 'relative',
          padding: '20px 20px 32px',
          background: `linear-gradient(180deg,
            rgba(139, 92, 246, 0.12) 0%,
            rgba(139, 92, 246, 0.04) 60%,
            transparent 100%)`,
          overflow: 'hidden',
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '-10%',
            width: '50%',
            height: '80%',
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '-15%',
            width: '40%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1,
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: AppColors.textPrimary,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <ChevronLeftIcon size={24} />
            </button>
            <h1 style={{
              flex: 1,
              margin: 0,
              fontSize: '22px',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '-0.5px',
            }}>
              Profile
            </h1>
            <div style={{ width: '40px' }} />
          </div>

          {/* Profile Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />

            {/* Avatar with ring */}
            <div
              onClick={handlePhotoClick}
              style={{
                position: 'relative',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
            >
              {/* Animated ring */}
              <div style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                background: levelConfig.gradient,
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                background: levelConfig.gradient,
                opacity: 0.5,
              }} />

              {/* Avatar */}
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: AppColors.accentPurple,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: '600',
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid rgba(0, 0, 0, 0.3)',
              }}>
                {userDocument?.photoURL ? (
                  <img
                    src={userDocument.photoURL}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ color: 'white' }}>
                    {(userDocument?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                  </span>
                )}

                {/* Edit overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '28px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}>
                  {uploadingPhoto ? (
                    <span style={{ fontSize: '10px', color: 'white' }}>Uploading...</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Photo error */}
            {photoError && (
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                color: AppColors.errorRose,
                textAlign: 'center',
              }}>
                {photoError}
              </p>
            )}

            {/* Name */}
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
            }}>
              {userDocument?.displayName || user?.displayName || 'Learner'}
            </h2>

            {/* Email */}
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              color: AppColors.textSecondary,
            }}>
              {user?.email}
            </p>

            {/* Level Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: levelConfig.gradient,
              boxShadow: `0 4px 16px ${levelConfig.glow}`,
              marginBottom: '16px',
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#000',
              }}>
                Level {userLevel}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'rgba(0, 0, 0, 0.6)',
              }}>
                {levelConfig.label}
              </span>
            </div>

            {/* Member Since & Lessons */}
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: AppColors.textSecondary,
              textAlign: 'center',
            }}>
              {userDocument?.createdAt && (
                <>
                  Member since {new Date(userDocument.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {' '}&bull;{' '}
                </>
              )}
              {userStats.totalSessions} lessons completed
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Stats Grid - 2 columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {/* Stars */}
            <div
              className="stat-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '20px 16px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-30%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                height: '60%',
                background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                fontSize: '28px',
                marginBottom: '6px',
                animation: 'float 3s ease-in-out infinite',
              }}>&#11088;</div>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {userStats.totalStars}
              </div>
              <div style={{
                fontSize: '12px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Stars Earned
              </div>
            </div>

            {/* Badges Count */}
            <div
              className="stat-card"
              onClick={() => navigate('/badges')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '20px 16px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-30%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                height: '60%',
                background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                fontSize: '28px',
                marginBottom: '6px',
                animation: 'float 3s ease-in-out infinite 0.5s',
              }}>&#127942;</div>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {earnedBadges}
              </div>
              <div style={{
                fontSize: '12px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Badges Earned
              </div>
            </div>
          </div>

          {/* Longest Streak */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '14px 20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>&#128293;</span>
              <span style={{
                fontSize: '14px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Longest Streak
              </span>
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {userStats.longestStreak} days
            </span>
          </div>

          {/* Level Progress */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: AppColors.textSecondary,
            }}>
              Level Progress
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level, index, arr) => {
                const isCurrentLevel = level === userLevel;
                const isPastLevel = arr.indexOf(userLevel) > index;
                const levelColors: Record<string, string> = {
                  'A1': '#22C55E',
                  'A2': '#16A34A',
                  'B1': '#EAB308',
                  'B2': '#EA580C',
                  'C1': '#8B5CF6',
                  'C2': '#EC4899',
                };

                return (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: isPastLevel || isCurrentLevel
                        ? levelColors[level]
                        : 'rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      boxShadow: isCurrentLevel ? `0 0 12px ${levelColors[level]}` : 'none',
                    }} />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: isCurrentLevel ? '700' : '500',
                      color: isCurrentLevel ? levelColors[level] : AppColors.textSecondary,
                      opacity: isPastLevel || isCurrentLevel ? 1 : 0.5,
                    }}>
                      {level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscription Card - shows plan and weekly usage */}
          <SubscriptionCard userDocument={userDocument} />

          {/* Learning Settings */}
          {user?.uid && (
            <LearningSettingsCard
              userId={user.uid}
              currentLanguage={userDocument?.targetLanguage}
              currentGoal={userDocument?.dailyPracticeGoal}
              currentVoice={userDocument?.preferredVoice}
            />
          )}

          {/* Account Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {/* Install App button (only shows if app not installed) */}
            <InstallAppButton />

            {/* Account Security button */}
            <button
              className="menu-button"
              onClick={() => navigate('/settings/account')}
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
                }}>&#128274;</span>
                <span>Account Security</span>
              </div>
              <ChevronRightIcon size={20} color={AppColors.textSecondary} />
            </button>

            {/* Help button */}
            <a
              className="menu-button"
              href="mailto:natasha.milto@ukr.net?subject=Help%20%26%20Support"
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
                textDecoration: 'none',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}>&#9993;</span>
                <span>Help & Support</span>
              </div>
              <ChevronRightIcon size={20} color={AppColors.textSecondary} />
            </a>

            {/* Logout button */}
            <button
              className="menu-button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#EF4444',
                fontSize: '15px',
                fontWeight: '500',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                opacity: loggingOut ? 0.5 : 1,
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
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                }}>&#128075;</span>
                <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </div>
            </button>
          </div>

          {/* App Version */}
          <div style={{
            textAlign: 'center',
            padding: '16px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.3)',
            }}>
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
