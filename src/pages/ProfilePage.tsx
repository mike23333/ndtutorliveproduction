/**
 * Profile Page - Redesigned
 * Premium profile with stunning visuals and engaging interactions
 */

import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { ChevronLeftIcon, ChevronRightIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useRecentBadges, useBadgeProgress } from '../hooks/useBadges';
import { BadgeIcon } from '../components/badges';
import { LearningSettingsCard } from '../components/profile';
import { useState, useEffect, useRef } from 'react';
import { getUserStarStats } from '../services/firebase/sessionData';
import { signOut, updateUserProfile } from '../services/firebase/auth';
import { uploadProfilePhoto } from '../services/firebase/storage';

interface UserStats {
  totalSessions: number;
  totalStars: number;
  averageStars: number;
  totalPracticeTime: number;
  currentStreak: number;
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
  const { recentBadges, loading: badgesLoading } = useRecentBadges(user?.uid, 4);
  const { earnedBadges, totalBadges } = useBadgeProgress(user?.uid);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    totalStars: 0,
    averageStars: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
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

  const formatPracticeTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
          </div>
        </div>

        {/* Content Sections */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {/* Streak */}
            <div
              className="stat-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '16px 12px',
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
                fontSize: '24px',
                marginBottom: '4px',
                animation: 'float 3s ease-in-out infinite',
              }}>🔥</div>
              <div style={{
                fontSize: '26px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {userStats.currentStreak}
              </div>
              <div style={{
                fontSize: '11px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Day Streak
              </div>
            </div>

            {/* Practice Time */}
            <div
              className="stat-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '16px 12px',
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
                background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                fontSize: '24px',
                marginBottom: '4px',
                animation: 'float 3s ease-in-out infinite 0.5s',
              }}>⏱️</div>
              <div style={{
                fontSize: '22px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {formatPracticeTime(userStats.totalPracticeTime)}
              </div>
              <div style={{
                fontSize: '11px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Practice Time
              </div>
            </div>

            {/* Stars */}
            <div
              className="stat-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '16px 12px',
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
                fontSize: '24px',
                marginBottom: '4px',
                animation: 'float 3s ease-in-out infinite 1s',
              }}>⭐</div>
              <div style={{
                fontSize: '26px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {userStats.totalStars}
              </div>
              <div style={{
                fontSize: '11px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                Stars Earned
              </div>
            </div>
          </div>

          {/* Learning Settings */}
          {user?.uid && (
            <LearningSettingsCard
              userId={user.uid}
              currentLanguage={userDocument?.targetLanguage}
              currentGoal={userDocument?.dailyPracticeGoal}
            />
          )}

          {/* Badges Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '50%',
              height: '100%',
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                }}>
                  🏆
                </span>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                  }}>
                    Badges
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: AppColors.textSecondary,
                  }}>
                    {earnedBadges} of {totalBadges} earned
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/badges')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: '#C4B5FD',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                View All
                <ChevronRightIcon size={16} />
              </button>
            </div>

            {/* Recent badges grid */}
            {badgesLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    }} />
                    <div style={{
                      width: '48px',
                      height: '10px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    }} />
                  </div>
                ))}
              </div>
            ) : recentBadges.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}>
                {recentBadges.map((userBadge, index) => (
                  <div
                    key={userBadge.badgeId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      animation: `fadeIn 0.4s ease-out ${index * 0.1}s backwards`,
                    }}
                  >
                    <BadgeIcon
                      iconName={userBadge.iconName}
                      category={userBadge.category}
                      size="md"
                      earned={true}
                    />
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: AppColors.textSecondary,
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}>
                      {userBadge.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎯</span>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: AppColors.textSecondary,
                }}>
                  Complete lessons to earn badges!
                </p>
              </div>
            )}
          </div>

          {/* Account Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {/* Settings button */}
            <button
              className="menu-button"
              onClick={() => navigate('/settings')}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}>⚙️</span>
                <span>Settings</span>
              </div>
              <ChevronRightIcon size={20} color={AppColors.textSecondary} />
            </button>

            {/* Help button */}
            <button
              className="menu-button"
              onClick={() => navigate('/help')}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}>❓</span>
                <span>Help & Support</span>
              </div>
              <ChevronRightIcon size={20} color={AppColors.textSecondary} />
            </button>

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
                }}>👋</span>
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
