/**
 * Badges Page - Redesigned
 * Premium badge collection with stunning visuals and engaging interactions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { ChevronLeftIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useBadgeProgress } from '../hooks/useBadges';
import { BadgeIcon } from '../components/badges';
import type { BadgeProgress, BadgeCategory } from '../types/badges';
import { CATEGORY_INFO } from '../services/firebase/badges';

// Category configuration with colors
const CATEGORY_CONFIG: Record<BadgeCategory, { gradient: string; glow: string; icon: string }> = {
  consistency: {
    gradient: 'linear-gradient(135deg, #F5D882 0%, #D4A855 100%)',
    glow: 'rgba(245, 216, 130, 0.3)',
    icon: '🔥',
  },
  excellence: {
    gradient: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)',
    glow: 'rgba(196, 181, 253, 0.3)',
    icon: '⭐',
  },
  time: {
    gradient: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)',
    glow: 'rgba(147, 197, 253, 0.3)',
    icon: '⏰',
  },
  explorer: {
    gradient: 'linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)',
    glow: 'rgba(134, 239, 172, 0.3)',
    icon: '🧭',
  },
  level: {
    gradient: 'linear-gradient(135deg, #DDD6FE 0%, #A78BFA 100%)',
    glow: 'rgba(221, 214, 254, 0.3)',
    icon: '📈',
  },
};

const CATEGORY_ORDER: BadgeCategory[] = ['consistency', 'excellence', 'time', 'explorer', 'level'];

export default function BadgesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    badgesByCategory,
    loading,
    error,
    earnedBadges,
    totalBadges,
    earnedPercent,
  } = useBadgeProgress(user?.uid);

  const [selectedBadge, setSelectedBadge] = useState<BadgeProgress | null>(null);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');

  // Filter badges by category
  const filteredCategories = activeCategory === 'all'
    ? CATEGORY_ORDER
    : [activeCategory];

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
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes ring-fill {
          from { stroke-dashoffset: 283; }
        }
        .badge-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .category-tab:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .badges-content::-webkit-scrollbar { width: 0; display: none; }
        .badges-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .badges-content { max-width: 540px; margin: 0 auto; }
          .badges-hero-inner { max-width: 540px; margin: 0 auto; }
          .badges-tabs-inner { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .badges-content { max-width: 640px; }
          .badges-hero-inner { max-width: 640px; }
          .badges-tabs-inner { max-width: 640px; }
        }
      `}</style>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(180deg,
          rgba(139, 92, 246, 0.15) 0%,
          rgba(139, 92, 246, 0.05) 50%,
          transparent 100%)`,
        overflow: 'hidden',
      }}>
        <div className="badges-hero-inner" style={{ padding: '20px 20px 24px', position: 'relative' }}>
        {/* Floating decorations */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          fontSize: '24px',
          animation: 'float 4s ease-in-out infinite',
          opacity: 0.6,
          pointerEvents: 'none',
        }}>🏆</div>
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          fontSize: '20px',
          animation: 'float 5s ease-in-out infinite 0.5s',
          opacity: 0.5,
          pointerEvents: 'none',
        }}>⭐</div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '25%',
          fontSize: '18px',
          animation: 'float 4.5s ease-in-out infinite 1s',
          opacity: 0.4,
          pointerEvents: 'none',
        }}>🎖️</div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
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
            Badge Collection
          </h1>
          <div style={{ width: '40px' }} />
        </div>

        {/* Progress Ring */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Circular Progress */}
          <div style={{ position: 'relative' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C4B5FD" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
                <filter id="badge-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#badgeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * earnedPercent / 100)}
                transform="rotate(-90 50 50)"
                filter="url(#badge-glow)"
                style={{
                  animation: 'ring-fill 1.5s ease-out forwards',
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            {/* Center content */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {earnedBadges}
              </div>
              <div style={{
                fontSize: '11px',
                color: AppColors.textSecondary,
                fontWeight: '500',
              }}>
                of {totalBadges}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                color: AppColors.textPrimary,
                lineHeight: 1,
              }}>
                {earnedPercent}%
              </div>
              <div style={{
                fontSize: '12px',
                color: AppColors.textSecondary,
                marginTop: '2px',
              }}>
                Complete
              </div>
            </div>
            <div style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
            }}>
              <span style={{ color: '#C4B5FD', fontWeight: '600' }}>{earnedBadges}</span>
              {' earned · '}
              <span style={{ color: AppColors.textSecondary }}>{totalBadges - earnedBadges} left</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div
          className="badges-tabs-inner"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 20px',
            overflowX: 'auto',
          }}
        >
        <button
          className="category-tab"
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: activeCategory === 'all'
              ? 'rgba(139, 92, 246, 0.2)'
              : 'rgba(255, 255, 255, 0.05)',
            color: activeCategory === 'all' ? '#C4B5FD' : AppColors.textSecondary,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          All
        </button>
        {CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            className="category-tab"
            onClick={() => setActiveCategory(category)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: activeCategory === category
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              color: activeCategory === category ? '#C4B5FD' : AppColors.textSecondary,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{CATEGORY_CONFIG[category].icon}</span>
            <span style={{ textTransform: 'capitalize' }}>{CATEGORY_INFO[category].name}</span>
          </button>
        ))}
        </div>
      </div>

      {/* Scrollable Badge Grid */}
      <div
        className="badges-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
        }}
      >
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                padding: '20px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <div style={{
                  height: '20px',
                  width: '120px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }} />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                }}>
                  {[...Array(4)].map((_, j) => (
                    <div key={j} style={{
                      height: '80px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '16px',
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            color: AppColors.errorRose,
            padding: '40px 20px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>😢</span>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredCategories.map((category, categoryIndex) => {
              const badges = badgesByCategory[category];
              const info = CATEGORY_INFO[category];
              const config = CATEGORY_CONFIG[category];
              const earnedCount = badges.filter((b) => b.earned).length;

              return (
                <div
                  key={category}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '24px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `fadeIn 0.5s ease-out ${categoryIndex * 0.1}s backwards`,
                  }}
                >
                  {/* Accent glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-25%',
                    width: '50%',
                    height: '100%',
                    background: `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`,
                    opacity: 0.3,
                    pointerEvents: 'none',
                  }} />

                  {/* Category Header */}
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
                        background: config.gradient,
                        boxShadow: `0 4px 12px ${config.glow}`,
                      }}>
                        {config.icon}
                      </span>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '700',
                          color: AppColors.textPrimary,
                          textTransform: 'capitalize',
                        }}>
                          {info.name}
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: AppColors.textSecondary,
                        }}>
                          {info.description}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: earnedCount === badges.length
                        ? 'rgba(74, 222, 128, 0.2)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: earnedCount === badges.length
                        ? '1px solid rgba(74, 222, 128, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: earnedCount === badges.length
                          ? AppColors.successGreen
                          : AppColors.textSecondary,
                      }}>
                        {earnedCount}/{badges.length}
                      </span>
                    </div>
                  </div>

                  {/* Badge Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  }}>
                    {badges.map((badgeProgress, badgeIndex) => (
                      <button
                        key={badgeProgress.badge.id}
                        className="badge-card"
                        onClick={() => setSelectedBadge(badgeProgress)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 6px',
                          borderRadius: '16px',
                          border: 'none',
                          backgroundColor: badgeProgress.earned
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          animation: `fadeIn 0.4s ease-out ${(categoryIndex * 0.1) + (badgeIndex * 0.05)}s backwards`,
                        }}
                      >
                        <BadgeIcon
                          iconName={badgeProgress.badge.iconName}
                          category={badgeProgress.badge.category}
                          size="md"
                          earned={badgeProgress.earned}
                        />
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <p style={{
                            margin: 0,
                            fontSize: '10px',
                            fontWeight: '600',
                            color: badgeProgress.earned
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                            opacity: badgeProgress.earned ? 1 : 0.6,
                          }}>
                            {badgeProgress.badge.name}
                          </p>
                          {!badgeProgress.earned && badgeProgress.progressPercent !== undefined && badgeProgress.progressPercent > 0 && (
                            <div style={{
                              marginTop: '6px',
                              width: '100%',
                              height: '3px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}>
                              <div
                                style={{
                                  width: `${badgeProgress.progressPercent}%`,
                                  height: '100%',
                                  background: config.gradient,
                                  borderRadius: '2px',
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: AppColors.surfaceDark,
              borderRadius: '28px',
              maxWidth: '340px',
              width: '100%',
              padding: '32px 24px',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>

            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Badge Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                position: 'relative',
              }}>
                {selectedBadge.earned && (
                  <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    background: `radial-gradient(circle, ${CATEGORY_CONFIG[selectedBadge.badge.category].glow} 0%, transparent 70%)`,
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }} />
                )}
                <BadgeIcon
                  iconName={selectedBadge.badge.iconName}
                  category={selectedBadge.badge.category}
                  size="xl"
                  earned={selectedBadge.earned}
                />
              </div>
            </div>

            {/* Badge Info */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: selectedBadge.earned ? AppColors.textPrimary : AppColors.textSecondary,
              }}>
                {selectedBadge.badge.name}
              </h3>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: AppColors.textSecondary,
                lineHeight: 1.5,
              }}>
                {selectedBadge.badge.description}
              </p>

              {/* Earned date or progress */}
              {selectedBadge.earned && selectedBadge.earnedAt ? (
                <div style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: AppColors.successGreen,
                    fontWeight: '600',
                  }}>
                    ✨ Earned on {selectedBadge.earnedAt.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: AppColors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: '600' }}>
                      {selectedBadge.progress || 0}/{selectedBadge.target || 1}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        width: `${selectedBadge.progressPercent || 0}%`,
                        height: '100%',
                        background: CATEGORY_CONFIG[selectedBadge.badge.category].gradient,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <p style={{
                    margin: '12px 0 0 0',
                    fontSize: '12px',
                    color: AppColors.textSecondary,
                  }}>
                    {((selectedBadge.target || 1) - (selectedBadge.progress || 0))} more to unlock!
                  </p>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                background: CATEGORY_CONFIG[selectedBadge.badge.category].gradient,
                border: 'none',
                borderRadius: '14px',
                color: '#000',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'transform 0.2s, opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              {selectedBadge.earned ? 'Awesome!' : 'Keep Going!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
