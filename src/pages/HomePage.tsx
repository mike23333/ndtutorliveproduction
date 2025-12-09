import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { PlayIcon, ClockIcon, StarIcon, SearchIcon, UserIcon, FireIcon } from '../theme/icons';
import { getAllActiveMissions } from '../services/firebase/missions';
import { getUserStarStats, getActiveReviewLesson } from '../services/firebase/sessionData';
import { getPronunciationCoachTemplate } from '../services/firebase/systemTemplates';
import { MissionDocument, ProficiencyLevel, ReviewLessonDocument, CustomLessonDocument } from '../types/firestore';
import { useAuth } from '../hooks/useAuth';
import { useCustomLessons } from '../hooks/useCustomLessons';
import { WeeklyReviewCard } from '../components/WeeklyReviewCard';
import {
  ToolsSection,
  CreateOwnModal,
  PronunciationModal,
  MyPracticeSection,
} from '../components/home';

// User stats from Firestore
interface UserStats {
  totalSessions: number;
  totalStars: number;
  averageStars: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
}

// Types for display
interface Lesson {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  durationMinutes?: number;
  level: string;
  category: string;
  stars: number;
  totalStars: number;
  isNew: boolean;
  isLocked: boolean;
  // New fields for enhanced lessons
  systemPrompt?: string;
  functionCallingEnabled?: boolean;
  functionCallingInstructions?: string;
  tone?: string;
}

// Convert MissionDocument to Lesson display format
const missionToLesson = (mission: MissionDocument, index: number): Lesson => {
  // Map tone to category
  const categoryMap: Record<string, string> = {
    friendly: 'Daily Life',
    formal: 'Work',
    encouraging: 'Learning',
    challenging: 'Advanced',
  };

  // Format duration for display
  const durationMinutes = mission.durationMinutes || 5;
  const durationDisplay = `${durationMinutes} min`;

  // For description, show a short preview (not the full system prompt)
  const shortDescription = mission.title; // Just use title as description

  return {
    id: mission.id,
    title: mission.title,
    description: shortDescription,
    image: mission.imageUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop`,
    duration: durationDisplay,
    durationMinutes: mission.durationMinutes,
    level: mission.targetLevel || 'A2',
    category: categoryMap[mission.tone] || 'Daily Life',
    stars: 0,
    totalStars: 5,
    isNew: index < 2,
    isLocked: false,
    // Pass through new fields for ChatPage
    systemPrompt: mission.systemPrompt || mission.scenario,
    functionCallingEnabled: mission.functionCallingEnabled,
    functionCallingInstructions: mission.functionCallingInstructions,
    tone: mission.tone,
  };
};

// Fallback sample data when no missions in DB
const fallbackLessons: Lesson[] = [
  {
    id: 'sample-1',
    title: "Ordering at a Café",
    description: "Practice ordering coffee, pastries, and handling common café situations with a friendly barista.",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    duration: "5 min",
    level: "A2",
    category: "Daily Life",
    stars: 0,
    totalStars: 5,
    isNew: true,
    isLocked: false,
  },
  {
    id: 'sample-2',
    title: "At the Train Station",
    description: "Learn to buy tickets, ask about schedules, and navigate train stations confidently.",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop",
    duration: "7 min",
    level: "B1",
    category: "Travel",
    stars: 0,
    totalStars: 5,
    isNew: false,
    isLocked: false,
  },
];

// Category filter pills
const categories = ["All", "Daily Life", "Travel", "Work", "Health"];

// Level badge component
const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    'A1': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
    'A2': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
    'B1': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
    'B2': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
    'C1': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
    'C2': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
  };

  const color = colors[level] || colors['A1'];

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: 'clamp(10px, 2.5vw, 12px)',
      fontWeight: '700',
      backgroundColor: color.bg,
      color: color.text,
    }}>
      {level}
    </span>
  );
};

// Star display for completed lessons
const StarDisplay = ({ stars, total }: { stars: number; total: number }) => {
  if (stars === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    }}>
      {[...Array(total)].map((_, i) => (
        <span
          key={i}
          style={{
            color: i < stars ? AppColors.whisperAmber : 'rgba(255,255,255,0.2)',
            fontSize: '12px',
          }}
        >
          <StarIcon size={12} />
        </span>
      ))}
    </div>
  );
};

// Lesson card component
const LessonCard = ({ lesson, isActive, onClick }: { lesson: Lesson; isActive: boolean; onClick: (lesson: Lesson) => void }) => {
  return (
    <div
      onClick={() => !lesson.isLocked && onClick(lesson)}
      style={{
        flex: '0 0 clamp(260px, 70vw, 300px)',
        height: 'clamp(340px, 50vh, 400px)',
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundColor: AppColors.surfaceDark,
        border: `1px solid ${isActive ? AppColors.accentPurple : AppColors.borderColor}`,
        cursor: lesson.isLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        transform: isActive ? 'scale(1)' : 'scale(0.95)',
        opacity: lesson.isLocked ? 0.6 : 1,
        position: 'relative',
        boxShadow: isActive ? `0 8px 32px rgba(100, 108, 255, 0.3)` : '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {/* Image section */}
      <div style={{
        height: '40%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <img
          src={lesson.image}
          alt={lesson.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: lesson.isLocked ? 'blur(4px) grayscale(50%)' : 'none',
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to top, rgba(30, 27, 75, 1) 0%, transparent 100%)',
        }} />

        {/* New badge */}
        {lesson.isNew && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: AppColors.accentPurple,
            color: AppColors.textDark,
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <FireIcon size={12} />
            NEW
          </div>
        )}

        {/* Locked overlay */}
        {lesson.isLocked && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
          </div>
        )}

        {/* Level badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
        }}>
          <LevelBadge level={lesson.level} />
        </div>
      </div>

      {/* Content section */}
      <div style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
        {/* Category */}
        <div style={{
          fontSize: 'clamp(10px, 2.5vw, 12px)',
          color: AppColors.accentPurple,
          fontWeight: '600',
          marginBottom: '6px',
          letterSpacing: '0.5px',
        }}>
          {lesson.category.toUpperCase()}
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: 'clamp(16px, 4vw, 20px)',
          fontWeight: '700',
          color: AppColors.textPrimary,
          lineHeight: 1.3,
        }}>
          {lesson.title}
        </h3>

        {/* Description */}
        <p style={{
          margin: '0 0 16px 0',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: AppColors.textSecondary,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {lesson.description}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Duration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            color: AppColors.textSecondary,
          }}>
            <ClockIcon />
            {lesson.duration}
          </div>

          {/* Stars or Start button */}
          {lesson.stars > 0 ? (
            <StarDisplay stars={lesson.stars} total={lesson.totalStars} />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: lesson.isLocked ? 'rgba(255,255,255,0.1)' : `${AppColors.accentPurple}22`,
              color: lesson.isLocked ? AppColors.textSecondary : AppColors.accentPurple,
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              fontWeight: '600',
            }}>
              <PlayIcon size={12} />
              {lesson.isLocked ? 'Locked' : 'Start'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Category filter
const CategoryFilter = ({ categories, activeCategory, onChange }: { categories: string[]; activeCategory: string; onChange: (cat: string) => void }) => (
  <div style={{
    display: 'flex',
    gap: 'clamp(6px, 2vw, 10px)',
    padding: '0 clamp(16px, 4vw, 24px)',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }}>
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onChange(cat)}
        style={{
          padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px)',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: activeCategory === cat ? AppColors.accentPurple : 'rgba(255,255,255,0.1)',
          color: activeCategory === cat ? AppColors.textDark : AppColors.textSecondary,
          fontSize: 'clamp(12px, 3vw, 14px)',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
        }}
      >
        {cat}
      </button>
    ))}
  </div>
);

// Pagination dots
const PaginationDots = ({ total, current, onChange }: { total: number; current: number; onChange: (i: number) => void }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: 'clamp(12px, 3vw, 20px)',
  }}>
    {[...Array(total)].map((_, i) => (
      <button
        key={i}
        onClick={() => onChange(i)}
        style={{
          width: current === i ? '24px' : '8px',
          height: '8px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: current === i ? AppColors.accentPurple : 'rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      />
    ))}
  </div>
);

// Header component
const Header = ({ userName, streakDays }: { userName: string; streakDays: number }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
  }}>
    <div>
      <p style={{
        margin: '0 0 4px 0',
        fontSize: 'clamp(12px, 3vw, 14px)',
        color: AppColors.textSecondary,
      }}>
        Welcome back,
      </p>
      <h1 style={{
        margin: 0,
        fontSize: 'clamp(20px, 5vw, 28px)',
        fontWeight: '700',
        color: AppColors.textPrimary,
      }}>
        {userName} 👋
      </h1>
    </div>

    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 14px)',
    }}>
      {/* Streak */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 14px)',
        borderRadius: '20px',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        color: AppColors.whisperAmber,
      }}>
        <span style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}>🔥</span>
        <span style={{ fontSize: 'clamp(12px, 3vw, 15px)', fontWeight: '700' }}>{streakDays}</span>
      </div>

      {/* Profile */}
      <button style={{
        width: 'clamp(38px, 10vw, 48px)',
        height: 'clamp(38px, 10vw, 48px)',
        borderRadius: '50%',
        border: `2px solid ${AppColors.borderColor}`,
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: AppColors.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <UserIcon size={20} />
      </button>
    </div>
  </div>
);

// Continue learning card
const ContinueLearningCard = ({ lesson, progress, onClick }: { lesson: Lesson; progress: number; onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{
      margin: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px)',
      padding: 'clamp(12px, 3vw, 18px)',
      borderRadius: '16px',
      background: `linear-gradient(135deg, ${AppColors.accentPurple}22 0%, ${AppColors.accentBlue}22 100%)`,
      border: `1px solid ${AppColors.accentPurple}44`,
      cursor: 'pointer',
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(10px, 2.5vw, 14px)',
    }}>
      <img
        src={lesson.image}
        alt={lesson.title}
        style={{
          width: 'clamp(50px, 15vw, 70px)',
          height: 'clamp(50px, 15vw, 70px)',
          borderRadius: '12px',
          objectFit: 'cover',
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 4px 0',
          fontSize: 'clamp(10px, 2.5vw, 12px)',
          color: AppColors.accentPurple,
          fontWeight: '600',
        }}>
          CONTINUE LEARNING
        </p>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: 'clamp(14px, 3.5vw, 17px)',
          fontWeight: '600',
          color: AppColors.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {lesson.title}
        </h3>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: AppColors.successGreen,
            borderRadius: '2px',
          }} />
        </div>
      </div>

      <div style={{
        width: 'clamp(36px, 10vw, 48px)',
        height: 'clamp(36px, 10vw, 48px)',
        borderRadius: '50%',
        backgroundColor: AppColors.accentPurple,
        color: AppColors.textDark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <PlayIcon size={16} />
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>(fallbackLessons);
  const [, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    totalStars: 0,
    averageStars: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [activeReview, setActiveReview] = useState<ReviewLessonDocument | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Custom lessons state
  const {
    lessons: customLessons,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useCustomLessons(user?.uid);
  const [showCreateOwnModal, setShowCreateOwnModal] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CustomLessonDocument | null>(null);

  // Get levels at or below user's level for filtering
  const getLevelFilter = (userLevel: ProficiencyLevel | undefined): string[] => {
    const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!userLevel) return []; // Show all if no level set

    const userLevelIndex = allLevels.indexOf(userLevel);
    if (userLevelIndex === -1) return [];

    // Return user's level and one below (to allow some variety)
    return allLevels.slice(Math.max(0, userLevelIndex - 1), userLevelIndex + 2);
  };

  const userLevelFilter = getLevelFilter(userDocument?.level);

  // Fetch lessons from Firestore on mount
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const missions = await getAllActiveMissions();
        if (missions.length > 0) {
          let fetchedLessons = missions.map(missionToLesson);

          // Filter by user level if set
          if (userDocument?.level && userLevelFilter.length > 0) {
            fetchedLessons = fetchedLessons.filter(lesson =>
              userLevelFilter.includes(lesson.level)
            );
          }

          setLessons(fetchedLessons.length > 0 ? fetchedLessons : fallbackLessons);
        }
      } catch (error) {
        console.error('Error fetching lessons:', error);
        // Keep fallback lessons on error
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [userDocument?.level]);

  // Fetch user stats from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      try {
        const stats = await getUserStarStats(user.uid);
        setUserStats({
          totalSessions: stats.totalSessions,
          totalStars: stats.totalStars,
          averageStars: stats.averageStars,
          totalPracticeTime: stats.totalPracticeTime,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchStats();
  }, [user?.uid]);

  // Fetch active weekly review
  useEffect(() => {
    const fetchReview = async () => {
      if (!user?.uid) return;

      console.log('[HomePage] Fetching review for user:', user.uid);
      try {
        const review = await getActiveReviewLesson(user.uid);
        console.log('[HomePage] Review fetched:', review);
        setActiveReview(review);
      } catch (error) {
        console.error('[HomePage] Error fetching active review:', error);
      }
    };

    fetchReview();
  }, [user?.uid]);

  // Filter lessons by category
  const filteredLessons = activeCategory === "All"
    ? lessons
    : lessons.filter(l => l.category === activeCategory);

  // Handle swipe/scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const cardWidth = 296; // approximate card width + gap
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(newIndex, filteredLessons.length - 1));
  };

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 296;
      carouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
    setCurrentIndex(index);
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Store role config in session storage for ChatPage
    const roleConfig = {
      id: lesson.id,
      name: lesson.title,
      icon: '📚',
      scenario: lesson.description, // Short description for display
      systemPrompt: lesson.systemPrompt, // Full prompt for Gemini
      persona: 'actor' as const,
      tone: lesson.tone || 'friendly',
      level: lesson.level,
      color: '#8B5CF6',
      durationMinutes: lesson.durationMinutes,
      functionCallingEnabled: lesson.functionCallingEnabled ?? true,
      functionCallingInstructions: lesson.functionCallingInstructions,
      imageUrl: lesson.image, // For Continue Learning feature
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));

    // Navigate to the chat page
    navigate(`/chat/${lesson.id}`);
  };

  // Handle review lesson click
  const handleReviewClick = () => {
    if (!activeReview) return;

    // Store role config in session storage for ChatPage
    // The generatedPrompt becomes the systemPrompt for the review conversation
    const roleConfig = {
      id: `review-${activeReview.id}`,
      name: 'Weekly Review',
      icon: '✨',
      scenario: `Practice conversation with your struggle words from this week`,
      systemPrompt: activeReview.generatedPrompt,
      persona: 'tutor' as const,
      tone: 'encouraging',
      level: activeReview.userLevel,
      color: '#8B5CF6',
      durationMinutes: activeReview.estimatedMinutes,
      functionCallingEnabled: true,
      // Mark this as a review lesson for completion tracking
      isReviewLesson: true,
      reviewId: activeReview.id,
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));

    // Navigate to the chat page with review ID
    navigate(`/chat/review-${activeReview.id}`);
  };

  // Handle "Create My Own" modal open
  const handleCreateOwnClick = () => {
    setEditingLesson(null);
    setShowCreateOwnModal(true);
  };

  // Handle "Pronunciation Coach" modal open
  const handlePronunciationClick = () => {
    setShowPronunciationModal(true);
  };

  // Handle custom lesson creation/update
  const handleCreateOrUpdateLesson = async (data: {
    title: string;
    description: string;
    imageUrl?: string;
    imageStoragePath?: string;
  }) => {
    const userLevel = userDocument?.level || 'B1';

    if (editingLesson) {
      // Update existing lesson
      await updateLesson(editingLesson.id, data, userLevel);
    } else {
      // Create new lesson
      await createLesson(data, userLevel);
    }
  };

  // Handle custom lesson click - navigate to chat
  const handleCustomLessonClick = (lesson: CustomLessonDocument) => {
    const roleConfig = {
      id: `custom-${lesson.id}`,
      name: lesson.title,
      icon: '✨',
      scenario: lesson.description,
      systemPrompt: lesson.systemPrompt,
      persona: 'tutor' as const,
      tone: 'friendly',
      level: userDocument?.level || 'B1',
      color: '#8B5CF6',
      durationMinutes: lesson.durationMinutes,
      functionCallingEnabled: true,
      // Custom lesson tracking
      isCustomLesson: true,
      customLessonId: lesson.id,
      imageUrl: lesson.imageUrl, // For Continue Learning feature
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/custom-${lesson.id}`);
  };

  // Handle custom lesson edit
  const handleEditLesson = (lesson: CustomLessonDocument) => {
    setEditingLesson(lesson);
    setShowCreateOwnModal(true);
  };

  // Handle custom lesson delete
  const handleDeleteLesson = async (lesson: CustomLessonDocument) => {
    if (window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) {
      await deleteLesson(lesson.id);
    }
  };

  // Handle pronunciation coach submit
  const handlePronunciationSubmit = async (words: string) => {
    try {
      // Get the pronunciation template
      const templateDoc = await getPronunciationCoachTemplate();
      const userLevel = userDocument?.level || 'B1';

      // Fill in the template
      const systemPrompt = templateDoc.template
        .replace(/\{\{level\}\}/g, userLevel)
        .replace(/\{\{words\}\}/g, words);

      const roleConfig = {
        id: `pronunciation-${Date.now()}`,
        name: 'Pronunciation Coach',
        icon: '🎯',
        scenario: `Practice pronunciation for: ${words}`,
        systemPrompt,
        persona: 'tutor' as const,
        tone: 'encouraging',
        level: userLevel,
        color: '#3B82F6',
        durationMinutes: 2,
        functionCallingEnabled: true,
        // Quick practice - no stats tracking
        isQuickPractice: true,
      };
      sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
      navigate(`/chat/pronunciation-${Date.now()}`);
    } catch (error) {
      console.error('Error starting pronunciation session:', error);
      alert('Failed to start pronunciation session. Please try again.');
    }
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
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        .carousel {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .carousel > div {
          scroll-snap-align: center;
        }
        @media (min-width: 768px) {
          .home-content { max-width: 800px; margin: 0 auto; }
          .stats-grid { max-width: 600px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .home-content { max-width: 1000px; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="home-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'clamp(24px, 5vw, 40px)',
        }}
      >
        {/* Header */}
        <Header userName={userDocument?.displayName || user?.displayName || 'Learner'} streakDays={userStats.currentStreak} />

        {/* Weekly Review Card - shown prominently when available */}
        {activeReview && (
          <WeeklyReviewCard
            review={activeReview}
            onClick={handleReviewClick}
          />
        )}

        {/* Continue Learning - show in-progress lesson if exists, otherwise first lesson */}
        {(userDocument?.currentLesson || lessons.length > 0) && (() => {
          // Check if user has an in-progress lesson
          const inProgressLesson = userDocument?.currentLesson;

          if (inProgressLesson) {
            // Create a lesson object for the in-progress session
            const continueLesson: Lesson = {
              id: inProgressLesson.missionId,
              title: inProgressLesson.title,
              description: 'Continue where you left off',
              image: inProgressLesson.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
              duration: '5 min',
              level: userDocument?.level || 'B1',
              category: 'Continue',
              stars: 0,
              totalStars: 5,
              isNew: false,
              isLocked: false,
            };

            // Find the full lesson from missions to get systemPrompt
            const fullLesson = lessons.find(l => l.id === inProgressLesson.missionId);

            return (
              <ContinueLearningCard
                lesson={continueLesson}
                progress={30}
                onClick={() => {
                  if (fullLesson) {
                    handleLessonClick(fullLesson);
                  } else {
                    // Fallback: navigate directly if we can't find the full lesson
                    navigate(`/chat/${inProgressLesson.missionId}`);
                  }
                }}
              />
            );
          }

          // No in-progress lesson, show first lesson from carousel
          if (lessons.length > 0) {
            return (
              <ContinueLearningCard
                lesson={lessons[0]}
                progress={0}
                onClick={() => handleLessonClick(lessons[0])}
              />
            );
          }

          return null;
        })()}

        {/* Section title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 24px)',
          marginBottom: 'clamp(12px, 3vw, 18px)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '700',
            color: AppColors.textPrimary,
          }}>
            Practice Scenarios
          </h2>
          <button style={{
            padding: '8px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
          }}>
            <SearchIcon size={18} />
          </button>
        </div>

        {/* Category filter */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />

        {/* Lesson carousel */}
        <div
          ref={carouselRef}
          className="carousel"
          onScroll={handleScroll}
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 20px)',
            padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 24px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {filteredLessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isActive={index === currentIndex}
              onClick={handleLessonClick}
            />
          ))}
        </div>

        {/* Pagination dots */}
        <PaginationDots
          total={filteredLessons.length}
          current={currentIndex}
          onChange={scrollToIndex}
        />

        {/* My Practice Section - custom lessons carousel */}
        <MyPracticeSection
          lessons={customLessons}
          onLessonClick={handleCustomLessonClick}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
        />

        {/* Tools Section - Create My Own & Pronunciation Coach */}
        <ToolsSection
          onCreateOwn={handleCreateOwnClick}
          onPronunciationCoach={handlePronunciationClick}
        />

        {/* Quick stats */}
        <div
          className="stats-grid"
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 14px)',
            padding: '0 clamp(16px, 4vw, 24px)',
            marginTop: 'clamp(8px, 2vw, 16px)',
          }}
        >
          <div style={{
            flex: 1,
            padding: 'clamp(12px, 3vw, 18px)',
            borderRadius: '16px',
            backgroundColor: AppColors.surfaceMedium,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(22px, 6vw, 32px)',
              fontWeight: '700',
              color: AppColors.textPrimary,
            }}>
              {userStats.totalSessions}
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              marginTop: '4px',
            }}>
              Lessons Done
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: 'clamp(12px, 3vw, 18px)',
            borderRadius: '16px',
            backgroundColor: AppColors.surfaceMedium,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(22px, 6vw, 32px)',
              fontWeight: '700',
              color: AppColors.successGreen,
            }}>
              {Math.floor(userStats.totalPracticeTime / 60)}
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              marginTop: '4px',
            }}>
              Minutes Practiced
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: 'clamp(12px, 3vw, 18px)',
            borderRadius: '16px',
            backgroundColor: AppColors.surfaceMedium,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(22px, 6vw, 32px)',
              fontWeight: '700',
              color: AppColors.whisperAmber,
            }}>
              {userStats.totalStars}
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              marginTop: '4px',
            }}>
              Stars Earned
            </div>
          </div>
        </div>
      </div>

      {/* Create My Own Modal */}
      <CreateOwnModal
        isOpen={showCreateOwnModal}
        onClose={() => {
          setShowCreateOwnModal(false);
          setEditingLesson(null);
        }}
        onSubmit={handleCreateOrUpdateLesson}
        userId={user?.uid || ''}
        editingLesson={editingLesson}
      />

      {/* Pronunciation Coach Modal */}
      <PronunciationModal
        isOpen={showPronunciationModal}
        onClose={() => setShowPronunciationModal(false)}
        onSubmit={handlePronunciationSubmit}
      />
    </div>
  );
}
