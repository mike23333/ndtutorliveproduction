import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, radius } from '../theme/colors';
import {
  HorizontalLevelScroller,
  CollectionCard,
  CategorySection,
  CreateScenarioBanner,
  ScenarioData,
  LevelKey,
  LessonDetailModal,
  LessonDetailData,
} from '../components/roleplay';
import { CreateOwnModal } from '../components/home/CreateOwnModal';
import { useStudentCollections, StudentCollection, StudentLesson } from '../hooks/useStudentCollections';
import { useCustomLessons } from '../hooks/useCustomLessons';
import { useAuth } from '../hooks/useAuth';
import type { ProficiencyLevel } from '../types/firestore';
import { getMission } from '../services/firebase/missions';

// === Data Types ===
interface LevelData {
  icon: string;
  title: string;
  scenes: number;
  key: LevelKey;
}

// Level filter type for collection detail view
type LevelFilter = 'all' | 'beginner' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate';

// === Static Data for UI (levels remain static) ===
const LEVELS: LevelData[] = [
  { icon: '🐣', title: 'Beginner', scenes: 26, key: 'beginner' },
  { icon: '📚', title: 'Pre-Intermediate', scenes: 27, key: 'pre-intermediate' },
  { icon: '🎯', title: 'Intermediate', scenes: 24, key: 'intermediate' },
  { icon: '🚀', title: 'Upper-Intermediate', scenes: 18, key: 'upper-intermediate' },
];

// Level filter chips for collection detail view
const LEVEL_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'pre-intermediate', label: 'Pre Intermediate' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'upper-intermediate', label: 'Upper Intermediate' },
];

// Map CEFR levels to UI level keys
const mapCEFRToLevelKey = (level: string | null): LevelKey | null => {
  if (!level) return null;
  switch (level) {
    case 'A1':
    case 'A2':
      return 'beginner';
    case 'B1':
      return 'pre-intermediate';
    case 'B2':
      return 'intermediate';
    case 'C1':
    case 'C2':
      return 'upper-intermediate';
    default:
      return null;
  }
};

// Get display label for level
const getLevelLabel = (level: string | null): string => {
  const levelKey = mapCEFRToLevelKey(level);
  if (!levelKey) return 'Beginner';
  const levelData = LEVELS.find((l) => l.key === levelKey);
  return levelData?.title || 'Beginner';
};

// Get color for level badge
const getLevelColor = (level: string | null): { bg: string; text: string; border: string } => {
  const levelKey = mapCEFRToLevelKey(level);
  switch (levelKey) {
    case 'beginner':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    case 'pre-intermediate':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    case 'intermediate':
      return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
    case 'upper-intermediate':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
    default:
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
  }
};

// === Header Component ===
function Header({ onBackClick, title }: { onBackClick: () => void; title: string }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        gap: '12px',
      }}
    >
      <button
        onClick={onBackClick}
        aria-label="Go back"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `1px solid ${AppColors.borderColor}`,
          backgroundColor: AppColors.surfaceLight,
          color: AppColors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1
        style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: AppColors.textPrimary,
          letterSpacing: '-0.5px',
        }}
      >
        {title}
      </h1>
    </header>
  );
}

// === Level Filter Chip Component ===
function LevelFilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: radius.full,
        border: isActive ? 'none' : `1.5px solid ${AppColors.borderColor}`,
        backgroundColor: isActive ? AppColors.accent : AppColors.bgTertiary,
        color: isActive ? AppColors.textDark : AppColors.textPrimary,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// === Collection Detail Lesson Card ===
function CollectionLessonCard({
  lesson,
  onClick,
}: {
  lesson: StudentLesson;
  onClick: () => void;
}) {
  const levelColors = getLevelColor(lesson.targetLevel);
  const levelLabel = getLevelLabel(lesson.targetLevel);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.xl,
        cursor: 'pointer',
        border: `1px solid ${AppColors.borderColor}`,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = AppColors.borderHover;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = AppColors.borderColor;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Lesson Illustration */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: radius.lg,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: AppColors.bgSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {lesson.imageUrl ? (
          <img
            src={lesson.imageUrl}
            alt={lesson.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '40px' }}>🎭</span>
        )}
      </div>

      {/* Lesson Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '17px',
            fontWeight: '600',
            color: AppColors.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {lesson.title}
        </h3>
        
        {/* Type Label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
            color: AppColors.textSecondary,
            fontSize: '14px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>Task</span>
        </div>

        {/* Level Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: radius.full,
            backgroundColor: levelColors.bg,
            border: `1px solid ${levelColors.border}`,
            color: levelColors.text,
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          {levelLabel}
        </div>
      </div>
    </div>
  );
}

// === Random Button Component ===
function RandomButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: radius.full,
        border: `1.5px solid ${AppColors.borderColor}`,
        background: AppColors.bgTertiary,
        fontSize: '14px',
        fontWeight: '500',
        color: AppColors.textPrimary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = AppColors.accent;
          e.currentTarget.style.color = AppColors.accent;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = AppColors.borderColor;
        e.currentTarget.style.color = AppColors.textPrimary;
      }}
    >
      Random
      <span style={{ fontSize: '16px' }}>🎲</span>
    </button>
  );
}

// === Collection Section (Firebase data) ===
function CollectionSection({
  collections,
  onCollectionClick,
  onRandomClick,
  loading,
}: {
  collections: StudentCollection[];
  onCollectionClick: (collection: StudentCollection) => void;
  onRandomClick: () => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: AppColors.textPrimary,
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Collections
          </h2>
          <RandomButton onClick={onRandomClick} disabled />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: AppColors.bgTertiary,
                borderRadius: radius.xl,
                height: '200px',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return null; // Don't show empty collection section
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.5px',
            margin: 0,
          }}
        >
          Collections
        </h2>
        <RandomButton onClick={onRandomClick} disabled={collections.length === 0} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {collections.map((col) => (
          <CollectionCard
            key={col.id}
            title={col.title}
            scenes={col.lessonCount}
            imageUrl={col.imageUrl}
            onClick={() => onCollectionClick(col)}
          />
        ))}
      </div>
    </div>
  );
}

// === Category Section from Firebase Collections ===
function FirebaseCategorySection({
  collections,
  selectedLevel,
  onScenarioClick,
}: {
  collections: StudentCollection[];
  selectedLevel: LevelKey | null;
  onScenarioClick: (lessonId: string) => void;
}) {
  // Group lessons by collection category
  const categorizedLessons: { name: string; items: ScenarioData[] }[] = [];

  collections.forEach((collection) => {
    const items: ScenarioData[] = collection.lessons
      .filter((lesson) => {
        if (!selectedLevel) return true;
        const lessonLevelKey = mapCEFRToLevelKey(lesson.targetLevel);
        return lessonLevelKey === selectedLevel;
      })
      .map((lesson) => ({
        title: lesson.title,
        type: 'Task' as const,
        level: mapCEFRToLevelKey(lesson.targetLevel) || 'beginner',
        illustration: 'default',
        imageUrl: lesson.imageUrl || undefined,
        lessonId: lesson.id,
      }));

    if (items.length > 0) {
      categorizedLessons.push({
        name: collection.title,
        items,
      });
    }
  });

  if (categorizedLessons.length === 0) {
    return null;
  }

  return (
    <>
      {categorizedLessons.map((category, idx) => (
        <CategorySection
          key={idx}
          name={category.name}
          items={category.items}
          onItemClick={(scenario) => {
            if (scenario.lessonId) {
              onScenarioClick(scenario.lessonId);
            }
          }}
          onSeeAll={() => {
            // Could navigate to collection detail
          }}
        />
      ))}
    </>
  );
}

// === Helper to map CEFR level to modal display label ===
const getModalLevelLabel = (level: string | null): string => {
  if (!level) return 'Beginner';
  switch (level) {
    case 'A1':
    case 'A2':
      return 'Beginner';
    case 'B1':
      return 'Pre-Intermediate';
    case 'B2':
      return 'Intermediate';
    case 'C1':
    case 'C2':
      return 'Upper-Intermediate';
    default:
      return 'Beginner';
  }
};

// === Fetch lesson detail from Firestore missions collection ===
const fetchLessonDetail = async (lessonId: string): Promise<LessonDetailData | null> => {
  try {
    const mission = await getMission(lessonId);
    if (!mission) return null;

    return {
      id: mission.id,
      title: mission.title,
      level: getModalLevelLabel(mission.targetLevel || null),
      imageUrl: mission.imageUrl || undefined,
      description: mission.description || `Practice this ${mission.durationMinutes || 5}-minute lesson to improve your English skills.`,
      tasks: mission.tasks?.map((t, i) => ({
        id: i + 1,
        text: t.text,
        completed: false,
      })),
      systemPrompt: mission.systemPrompt || mission.scenario,
      durationMinutes: mission.durationMinutes,
      tone: mission.tone,
      functionCallingEnabled: mission.functionCallingEnabled,
      functionCallingInstructions: mission.functionCallingInstructions,
      teacherId: mission.teacherId,
    };
  } catch (error) {
    console.error('Error fetching lesson detail:', error);
    return null;
  }
};

// === Main Page Component ===
export default function RolePlayPage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const { collections, loading } = useStudentCollections();
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | null>(null);
  const [showCreateOwnModal, setShowCreateOwnModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<StudentCollection | null>(null);
  const [collectionLevelFilter, setCollectionLevelFilter] = useState<LevelFilter>('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonDetailData | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // Custom lessons hook for creating scenarios
  const { createLesson } = useCustomLessons(user?.uid, userDocument?.displayName);

  // Determine user type and access
  const isTeacher = userDocument?.role === 'teacher';
  const hasTeacherAccess = isTeacher || !!userDocument?.teacherId;

  // Calculate level counts from Firebase data
  const levelCounts = collections.reduce(
    (acc, col) => {
      col.lessons.forEach((lesson) => {
        const levelKey = mapCEFRToLevelKey(lesson.targetLevel);
        if (levelKey && acc[levelKey] !== undefined) {
          acc[levelKey]++;
        }
      });
      return acc;
    },
    { beginner: 0, 'pre-intermediate': 0, intermediate: 0, 'upper-intermediate': 0 } as Record<LevelKey, number>
  );

  // Update LEVELS with actual counts
  const levelsWithCounts = LEVELS.map((level) => ({
    ...level,
    scenes: levelCounts[level.key] || 0,
  }));

  const handleLevelClick = useCallback((level: LevelData) => {
    setSelectedLevel((prev) => (prev === level.key ? null : level.key));
  }, []);

  const handleCollectionClick = useCallback((collection: StudentCollection) => {
    setSelectedCollection(collection);
    setCollectionLevelFilter('all'); // Reset filter when opening collection
  }, []);

  // Filter lessons based on selected level filter
  const getFilteredLessons = useCallback(
    (lessons: StudentLesson[]): StudentLesson[] => {
      if (collectionLevelFilter === 'all') return lessons;
      return lessons.filter((lesson) => {
        const lessonLevelKey = mapCEFRToLevelKey(lesson.targetLevel);
        return lessonLevelKey === collectionLevelFilter;
      });
    },
    [collectionLevelFilter]
  );

  const handleRandomClick = useCallback(() => {
    const allLessons = collections.flatMap((col) => col.lessons);
    if (allLessons.length === 0) return;
    const randomLesson = allLessons[Math.floor(Math.random() * allLessons.length)];
    navigate(`/chat/${randomLesson.id}`);
  }, [collections, navigate]);

  const handleScenarioClick = useCallback(
    async (lessonId: string) => {
      // Fetch full lesson data from Firestore
      const lessonDetail = await fetchLessonDetail(lessonId);
      if (lessonDetail) {
        setSelectedLesson(lessonDetail);
        setShowLessonModal(true);
      } else {
        // Fallback: navigate directly if fetch fails
        navigate(`/chat/${lessonId}`);
      }
    },
    [navigate]
  );

  const handleCreateScenario = useCallback(() => {
    setShowCreateOwnModal(true);
  }, []);

  const handleCreateOwnSubmit = useCallback(
    async (data: {
      title: string;
      description: string;
      imageUrl?: string;
      imageStoragePath?: string;
    }) => {
      const userLevel = (userDocument?.level as ProficiencyLevel) || 'B1';
      const result = await createLesson(data, userLevel);
      navigate(`/chat/custom-${result.lesson.id}`);
    },
    [createLesson, navigate, userDocument?.level]
  );

  // Show message for students without a teacher
  if (!hasTeacherAccess) {
    return (
      <div
        style={{
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
        }}
      >
        <Header onBackClick={() => navigate(-1)} title="Role Play" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔗</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
              Not connected to a teacher
            </h2>
            <p style={{ margin: 0, fontSize: '15px', color: AppColors.textSecondary, maxWidth: '300px' }}>
              Join a class using your teacher's code to access roleplay collections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
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
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .roleplay-content::-webkit-scrollbar { width: 0; display: none; }
        .roleplay-content { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (min-width: 640px) {
          .roleplay-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .roleplay-content { max-width: 640px; }
        }
      `}</style>

      <Header
        onBackClick={() => selectedCollection ? setSelectedCollection(null) : navigate(-1)}
        title={selectedCollection ? selectedCollection.title : 'Role Play'}
      />

      <div
        className="roleplay-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          padding: '0 20px 40px',
        }}
      >
        {/* Collection Detail View */}
        {selectedCollection ? (
          <div>
            {/* Level Filter Chips */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                overflowX: 'auto',
                paddingBottom: '4px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {LEVEL_FILTERS.map((filter) => (
                <LevelFilterChip
                  key={filter.key}
                  label={filter.label}
                  isActive={collectionLevelFilter === filter.key}
                  onClick={() => setCollectionLevelFilter(filter.key)}
                />
              ))}
            </div>

            {/* Lessons List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getFilteredLessons(selectedCollection.lessons).map((lesson) => (
                <CollectionLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleScenarioClick(lesson.id)}
                />
              ))}
            </div>

            {/* Empty state for filtered results */}
            {getFilteredLessons(selectedCollection.lessons).length === 0 && selectedCollection.lessons.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: AppColors.textSecondary }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ margin: '0 0 16px 0' }}>No lessons found for this level.</p>
                <button
                  onClick={() => setCollectionLevelFilter('all')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: radius.md,
                    border: 'none',
                    backgroundColor: AppColors.accent,
                    color: AppColors.textDark,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Show All
                </button>
              </div>
            )}

            {/* Empty state for collection with no lessons */}
            {selectedCollection.lessons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: AppColors.textSecondary }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ margin: 0 }}>No lessons in this collection yet.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Level filter indicator */}
            {selectedLevel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: AppColors.accentMuted,
              borderRadius: radius.md,
            }}
          >
            <span style={{ color: AppColors.textSecondary, fontSize: '14px' }}>Filtering by:</span>
            <span style={{ color: AppColors.accent, fontWeight: '600', fontSize: '14px' }}>
              {LEVELS.find((l) => l.key === selectedLevel)?.title}
            </span>
            <button
              onClick={() => setSelectedLevel(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Language Level Section - Horizontal scrollable */}
        <HorizontalLevelScroller levels={levelsWithCounts} onLevelClick={handleLevelClick} />

        {/* Collection Section - From Firebase */}
        <CollectionSection
          collections={collections}
          onCollectionClick={handleCollectionClick}
          onRandomClick={handleRandomClick}
          loading={loading}
        />

        {/* Create Your Own Banner */}
        <CreateScenarioBanner onClick={handleCreateScenario} />

        {/* Category Sections - From Firebase collections */}
        <FirebaseCategorySection
          collections={collections}
          selectedLevel={selectedLevel}
          onScenarioClick={handleScenarioClick}
        />

        {/* Empty state when filtering and no results */}
        {selectedLevel && collections.length > 0 && (
          (() => {
            const hasMatchingLessons = collections.some((col) =>
              col.lessons.some((lesson) => mapCEFRToLevelKey(lesson.targetLevel) === selectedLevel)
            );
            if (!hasMatchingLessons) {
              return (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: AppColors.textSecondary }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <p style={{ margin: 0, fontSize: '16px' }}>No scenarios found for this level.</p>
                  <button
                    onClick={() => setSelectedLevel(null)}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      borderRadius: radius.md,
                      border: 'none',
                      backgroundColor: AppColors.accent,
                      color: AppColors.textDark,
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              );
            }
            return null;
          })()
        )}

        {/* Empty state when no collections at all */}
        {!loading && collections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <p style={{ color: AppColors.textSecondary, margin: 0 }}>No collections available yet.</p>
            <p style={{ color: AppColors.textSecondary, margin: '8px 0 0 0', fontSize: '14px' }}>
              {isTeacher
                ? 'Create collections in your Teacher Dashboard to see them here.'
                : "Your teacher hasn't created any roleplay collections."}
            </p>
          </div>
        )}
          </>
        )}
      </div>

      {/* Create Your Own Modal */}
      {user && (
        <CreateOwnModal
          isOpen={showCreateOwnModal}
          onClose={() => setShowCreateOwnModal(false)}
          onSubmit={handleCreateOwnSubmit}
          userId={user.uid}
        />
      )}

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        isOpen={showLessonModal}
        onClose={() => {
          setShowLessonModal(false);
          setSelectedLesson(null);
        }}
        onStartChat={(lessonId) => {
          setShowLessonModal(false);
          navigate(`/chat/${lessonId}`);
        }}
        lesson={selectedLesson}
      />
    </div>
  );
}
