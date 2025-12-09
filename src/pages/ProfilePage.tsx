/**
 * Profile Page
 * Displays user profile, stats, and recent badges
 */

import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { StarIcon, ClockIcon, FireIcon, ChevronLeftIcon, ChevronRightIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useRecentBadges, useBadgeProgress } from '../hooks/useBadges';
import { BadgeIcon } from '../components/badges';
import { useState, useEffect, useRef } from 'react';
import { getUserStarStats } from '../services/firebase/sessionData';
import { signOut, updateUserProfile } from '../services/firebase/auth';
import { uploadProfilePhoto } from '../services/firebase/storage';

// User stats interface
interface UserStats {
  totalSessions: number;
  totalStars: number;
  averageStars: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
}

// Level colors
const levelColors: Record<string, { bg: string; text: string }> = {
  'A1': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
  'A2': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
  'B1': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
  'B2': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
  'C1': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
  'C2': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
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

  // Fetch user stats
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
      // Force a small delay to let the context refresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setPhotoError(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const userLevel = userDocument?.level || 'B1';
  const levelColor = levelColors[userLevel] || levelColors['B1'];

  // Format practice time
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
      background: gradientBackground,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
        borderBottom: `1px solid ${AppColors.borderColor}`,
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
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
          }}
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 style={{
          flex: 1,
          margin: 0,
          fontSize: 'clamp(18px, 4.5vw, 22px)',
          fontWeight: '700',
          textAlign: 'center',
        }}>
          Profile
        </h1>
        <div style={{ width: '40px' }} /> {/* Spacer for centering */}
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'clamp(16px, 4vw, 24px)',
      }}>
        {/* Profile Card */}
        <div style={{
          backgroundColor: AppColors.surfaceMedium,
          borderRadius: '20px',
          padding: 'clamp(20px, 5vw, 32px)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          textAlign: 'center',
        }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />

          {/* Avatar with edit overlay */}
          <div
            onClick={handlePhotoClick}
            style={{
              width: 'clamp(80px, 20vw, 100px)',
              height: 'clamp(80px, 20vw, 100px)',
              borderRadius: '50%',
              backgroundColor: AppColors.accentPurple,
              margin: '0 auto clamp(12px, 3vw, 16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(32px, 8vw, 40px)',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
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
              (userDocument?.displayName || user?.displayName || 'U')[0].toUpperCase()
            )}

            {/* Edit overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '32px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: uploadingPhoto ? 1 : 0.8,
              transition: 'opacity 0.2s',
            }}>
              {uploadingPhoto ? (
                <span style={{ fontSize: '10px', color: 'white' }}>Uploading...</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </div>

          {/* Photo error message */}
          {photoError && (
            <p style={{
              margin: '0 0 12px 0',
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: AppColors.errorRose,
              textAlign: 'center',
            }}>
              {photoError}
            </p>
          )}

          {/* Name */}
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(20px, 5vw, 26px)',
            fontWeight: '700',
          }}>
            {userDocument?.displayName || user?.displayName || 'Learner'}
          </h2>

          {/* Email */}
          <p style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}>
            {user?.email}
          </p>

          {/* Level Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: levelColor.bg,
            color: levelColor.text,
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: '700',
          }}>
            Level {userLevel}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 2vw, 12px)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
        }}>
          {/* Streak */}
          <div style={{
            backgroundColor: AppColors.surfaceMedium,
            borderRadius: '16px',
            padding: 'clamp(12px, 3vw, 18px)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '4px',
            }}>
              <FireIcon size={20} color={AppColors.whisperAmber} />
              <span style={{
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: '700',
                color: AppColors.whisperAmber,
              }}>
                {userStats.currentStreak}
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: AppColors.textSecondary,
            }}>
              Day Streak
            </div>
          </div>

          {/* Practice Time */}
          <div style={{
            backgroundColor: AppColors.surfaceMedium,
            borderRadius: '16px',
            padding: 'clamp(12px, 3vw, 18px)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '4px',
            }}>
              <ClockIcon size={20} color={AppColors.accentBlue} />
              <span style={{
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: '700',
                color: AppColors.accentBlue,
              }}>
                {formatPracticeTime(userStats.totalPracticeTime)}
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: AppColors.textSecondary,
            }}>
              Practice Time
            </div>
          </div>

          {/* Stars */}
          <div style={{
            backgroundColor: AppColors.surfaceMedium,
            borderRadius: '16px',
            padding: 'clamp(12px, 3vw, 18px)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '4px',
            }}>
              <StarIcon size={20} color={AppColors.whisperAmber} />
              <span style={{
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: '700',
                color: AppColors.whisperAmber,
              }}>
                {userStats.totalStars}
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: AppColors.textSecondary,
            }}>
              Stars Earned
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div style={{
          backgroundColor: AppColors.surfaceMedium,
          borderRadius: '20px',
          padding: 'clamp(16px, 4vw, 24px)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(12px, 3vw, 16px)',
          }}>
            <h3 style={{
              margin: 0,
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '700',
            }}>
              Badges
            </h3>
            <button
              onClick={() => navigate('/badges')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: AppColors.accentPurple,
                fontSize: 'clamp(12px, 3vw, 14px)',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              View All
              <ChevronRightIcon size={16} />
            </button>
          </div>

          {/* Badge count */}
          <p style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}>
            {earnedBadges} of {totalBadges} badges earned
          </p>

          {/* Recent badges grid */}
          {badgesLoading ? (
            <div style={{
              textAlign: 'center',
              color: AppColors.textSecondary,
              padding: '20px',
            }}>
              Loading badges...
            </div>
          ) : recentBadges.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'clamp(8px, 2vw, 12px)',
            }}>
              {recentBadges.map((userBadge) => (
                <div
                  key={userBadge.badgeId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BadgeIcon
                    iconName={userBadge.iconName}
                    category={userBadge.category}
                    size="md"
                    earned={true}
                  />
                  <span style={{
                    fontSize: 'clamp(9px, 2.2vw, 11px)',
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
              color: AppColors.textSecondary,
              padding: '20px',
            }}>
              Complete lessons to earn badges!
            </div>
          )}
        </div>

        {/* Account Section */}
        <div style={{
          backgroundColor: AppColors.surfaceMedium,
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          {/* Settings button */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 24px)',
              border: 'none',
              backgroundColor: 'transparent',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              cursor: 'pointer',
              borderBottom: `1px solid ${AppColors.borderColor}`,
            }}
          >
            <span>Settings</span>
            <ChevronRightIcon size={20} color={AppColors.textSecondary} />
          </button>

          {/* Help button */}
          <button
            onClick={() => navigate('/help')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 24px)',
              border: 'none',
              backgroundColor: 'transparent',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              cursor: 'pointer',
              borderBottom: `1px solid ${AppColors.borderColor}`,
            }}
          >
            <span>Help & Support</span>
            <ChevronRightIcon size={20} color={AppColors.textSecondary} />
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 24px)',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.5 : 1,
            }}
          >
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
