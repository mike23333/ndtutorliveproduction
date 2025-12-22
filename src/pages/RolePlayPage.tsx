/**
 * RolePlayPage - Premium Redesign
 * Glass-morphic design with animated components
 */

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
  RolePlayHeader,
  LevelFilterChips,
  RandomButton,
  EmptyState,
  LessonCard,
  mapCEFRToLevelKey,
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

type LevelFilter = 'all' | 'beginner' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate';

// === Static Data ===
const LEVELS: LevelData[] = [
  { icon: '🐣', title: 'Beginner', scenes: 0, key: 'beginner' },
  { icon: '📚', title: 'Pre-Intermediate', scenes: 0, key: 'pre-intermediate' },
  { icon: '🎯', title: 'Intermediate', scenes: 0, key: 'intermediate' },
  { icon: '🚀', title: 'Upper-Intermediate', scenes: 0, key: 'upper-intermediate' },
];

const LEVEL_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'pre-intermediate', label: 'Pre Intermediate' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'upper-intermediate', label: 'Upper Intermediate' },
];

// === Helper Functions ===
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

const fetchLessonDetail = async (lessonId: string): Promise<LessonDetailData | null> => {
  try {
    const mission = await getMission(lessonId);
    if (!mission) return null;

    return {
      id: mission.id,
      title: mission.title,
      level: getModalLevelLabel(mission.targetLevel || null),
      imageUrl: mission.imageUrl || undefined,
      description: mission.description || `Practice this ${mission.durationMinutes || 5}-minute lesson.`,
      tasks: mission.tasks?.map((t, i) => ({ id: String(i + 1), text: t.text, completed: false })),
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

/**
 * Request microphone permission before navigating to chat
 * iOS Safari requires getUserMedia to be called from a direct user gesture
 * @returns true if permission granted or non-blocking error, false if explicitly denied
 */
async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks - we just needed to trigger the permission prompt
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'NotAllowedError') {
      alert('Microphone access is required for voice interaction. Please allow microphone permission and try again.');
      return false;
    }
    // For other errors (NotFoundError, etc.), continue to chat page and handle there
    console.warn('Pre-navigation microphone check failed:', err.message);
    return true;
  }
}

// === Main Component ===
export default function RolePlayPage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const { collections, loading } = useStudentCollections();

  // View states
  const [selectedCollection, setSelectedCollection] = useState<StudentCollection | null>(null);
  const [collectionLevelFilter, setCollectionLevelFilter] = useState<LevelFilter>('all');
  const [selectedLevelView, setSelectedLevelView] = useState<LevelKey | null>(null);
  const [levelViewFilter, setLevelViewFilter] = useState<LevelFilter>('all');

  // Modal states
  const [showCreateOwnModal, setShowCreateOwnModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetailData | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const { createLesson } = useCustomLessons(user?.uid, userDocument?.displayName);
  const isTeacher = userDocument?.role === 'teacher';
  const hasTeacherAccess = isTeacher || !!userDocument?.teacherId;

  // Calculate level counts
  const levelCounts = collections.reduce(
    (acc, col) => {
      col.lessons.forEach((lesson) => {
        const levelKey = mapCEFRToLevelKey(lesson.targetLevel) as LevelKey;
        if (levelKey && levelKey in acc) {
          acc[levelKey]++;
        }
      });
      return acc;
    },
    { beginner: 0, 'pre-intermediate': 0, intermediate: 0, 'upper-intermediate': 0 } as Record<LevelKey, number>
  );

  const levelsWithCounts = LEVELS.map((level) => ({
    ...level,
    scenes: levelCounts[level.key] || 0,
  }));

  const totalLessons = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  // === Handlers ===
  const handleBack = useCallback(() => {
    if (selectedCollection) {
      setSelectedCollection(null);
    } else if (selectedLevelView) {
      setSelectedLevelView(null);
    } else {
      navigate(-1);
    }
  }, [selectedCollection, selectedLevelView, navigate]);

  const handleLevelClick = useCallback((level: LevelData) => {
    setSelectedLevelView(level.key);
    setLevelViewFilter(level.key);
  }, []);

  const handleCollectionClick = useCallback((collection: StudentCollection) => {
    setSelectedCollection(collection);
    setCollectionLevelFilter('all');
  }, []);

  const handleRandomClick = useCallback(async () => {
    const allLessons = collections.flatMap((col) => col.lessons);
    if (allLessons.length === 0) return;
    const randomLesson = allLessons[Math.floor(Math.random() * allLessons.length)];
    const lessonDetail = await fetchLessonDetail(randomLesson.id);
    if (lessonDetail) {
      setSelectedLesson(lessonDetail);
      setShowLessonModal(true);
    } else {
      // Request microphone permission before navigating (for iOS Safari)
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
      navigate(`/chat/${randomLesson.id}`);
    }
  }, [collections, navigate]);

  const handleScenarioClick = useCallback(
    async (lessonId: string) => {
      const lessonDetail = await fetchLessonDetail(lessonId);
      if (lessonDetail) {
        setSelectedLesson(lessonDetail);
        setShowLessonModal(true);
      } else {
        // Request microphone permission before navigating (for iOS Safari)
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
        navigate(`/chat/${lessonId}`);
      }
    },
    [navigate]
  );

  const handleCreateOwnSubmit = useCallback(
    async (data: { title: string; description: string; imageUrl?: string; imageStoragePath?: string }) => {
      const userLevel = (userDocument?.level as ProficiencyLevel) || 'B1';
      await createLesson(data, userLevel);
      setShowCreateOwnModal(false);
      navigate('/');
    },
    [createLesson, navigate, userDocument?.level]
  );

  // === Filter Functions ===
  const getFilteredLessons = useCallback(
    (lessons: StudentLesson[], filter: LevelFilter): StudentLesson[] => {
      if (filter === 'all') return lessons;
      return lessons.filter((lesson) => mapCEFRToLevelKey(lesson.targetLevel) === filter);
    },
    []
  );

  const getAllLessonsByLevel = useCallback(
    (filter: LevelFilter): StudentLesson[] => {
      const allLessons = collections.flatMap((col) => col.lessons);
      if (filter === 'all') return allLessons;
      return allLessons.filter((lesson) => mapCEFRToLevelKey(lesson.targetLevel) === filter);
    },
    [collections]
  );

  // === No Teacher Access View ===
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
        <RolePlayHeader onBack={() => navigate(-1)} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            icon="🔗"
            title="Not connected to a teacher"
            message="Join a class using your teacher's code to access roleplay collections."
          />
        </div>
      </div>
    );
  }

  // === Main Render ===
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .section-animate { animation: fadeInUp 0.5s ease-out backwards; }
        .section-animate:nth-child(1) { animation-delay: 0.05s; }
        .section-animate:nth-child(2) { animation-delay: 0.1s; }
        .section-animate:nth-child(3) { animation-delay: 0.15s; }
        .section-animate:nth-child(4) { animation-delay: 0.2s; }
        @media (min-width: 640px) {
          .roleplay-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .roleplay-content { max-width: 640px; }
        }
      `}</style>

      {/* Header */}
      <RolePlayHeader onBack={handleBack} />

      {/* Scrollable Content */}
      <div
        className="roleplay-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        }}
      >
        {/* === Collection Detail View === */}
        {selectedCollection ? (
          <div style={{ padding: '0 20px' }}>
            {/* Collection Title */}
            <h2
              className="section-animate"
              style={{
                margin: '0 0 20px 0',
                fontSize: '26px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.5px',
                textAlign: 'center',
              }}
            >
              {selectedCollection.title}
            </h2>

            {/* Level Filters */}
            <div className="section-animate" style={{ marginBottom: '20px' }}>
              <LevelFilterChips
                filters={LEVEL_FILTERS}
                activeFilter={collectionLevelFilter}
                onFilterChange={(key) => setCollectionLevelFilter(key as LevelFilter)}
              />
            </div>

            {/* Lessons List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getFilteredLessons(selectedCollection.lessons, collectionLevelFilter).map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  imageUrl={lesson.imageUrl || undefined}
                  targetLevel={lesson.targetLevel}
                  onClick={() => handleScenarioClick(lesson.id)}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>

            {/* Empty State */}
            {getFilteredLessons(selectedCollection.lessons, collectionLevelFilter).length === 0 && (
              <EmptyState
                icon="🔍"
                title="No lessons found"
                message="Try selecting a different level filter."
                action={{
                  label: 'Show All',
                  onClick: () => setCollectionLevelFilter('all'),
                }}
              />
            )}
          </div>
        ) : selectedLevelView ? (
          /* === Level Detail View === */
          <div style={{ padding: '0 20px' }}>
            {/* Level Title */}
            <h2
              className="section-animate"
              style={{
                margin: '0 0 20px 0',
                fontSize: '26px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.5px',
                textAlign: 'center',
              }}
            >
              {levelViewFilter === 'all'
                ? 'All Lessons'
                : LEVELS.find((l) => l.key === levelViewFilter)?.title || 'Lessons'}
            </h2>

            {/* Level Filters */}
            <div className="section-animate" style={{ marginBottom: '20px' }}>
              <LevelFilterChips
                filters={LEVEL_FILTERS}
                activeFilter={levelViewFilter}
                onFilterChange={(key) => setLevelViewFilter(key as LevelFilter)}
              />
            </div>

            {/* Lessons List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getAllLessonsByLevel(levelViewFilter).map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  imageUrl={lesson.imageUrl || undefined}
                  targetLevel={lesson.targetLevel}
                  onClick={() => handleScenarioClick(lesson.id)}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>

            {/* Empty State */}
            {getAllLessonsByLevel(levelViewFilter).length === 0 && (
              <EmptyState
                icon="📭"
                title="No lessons found"
                message="No lessons available for this level yet."
                action={{
                  label: 'Show All Levels',
                  onClick: () => setLevelViewFilter('all'),
                }}
              />
            )}
          </div>
        ) : (
          /* === Main View === */
          <>
            {/* Level Scroller */}
            <div className="section-animate">
              <HorizontalLevelScroller levels={levelsWithCounts} onLevelClick={handleLevelClick} />
            </div>

            {/* Collections Grid */}
            {loading ? (
              <div className="section-animate" style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: AppColors.textPrimary, margin: 0 }}>
                    Collections
                  </h2>
                  <RandomButton onClick={handleRandomClick} disabled compact />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: AppColors.bgTertiary,
                        borderRadius: radius.xl,
                        height: '180px',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : collections.length > 0 ? (
              <div className="section-animate" style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: AppColors.textPrimary, margin: 0 }}>
                    Collections
                  </h2>
                  <RandomButton onClick={handleRandomClick} disabled={totalLessons === 0} compact />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {collections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      title={col.title}
                      scenes={col.lessonCount}
                      imageUrl={col.imageUrl}
                      onClick={() => handleCollectionClick(col)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Create Your Own */}
            <div className="section-animate" style={{ padding: '0 20px' }}>
              <CreateScenarioBanner onClick={() => setShowCreateOwnModal(true)} />
            </div>

            {/* Category Sections */}
            {collections.map((collection, idx) => {
              const items: ScenarioData[] = collection.lessons.map((lesson) => ({
                title: lesson.title,
                type: 'Task' as const,
                level: mapCEFRToLevelKey(lesson.targetLevel) as LevelKey,
                illustration: 'default',
                imageUrl: lesson.imageUrl || undefined,
                lessonId: lesson.id,
              }));

              if (items.length === 0) return null;

              return (
                <div key={collection.id} className="section-animate" style={{ animationDelay: `${0.25 + idx * 0.05}s` }}>
                  <CategorySection
                    name={collection.title}
                    items={items}
                    onItemClick={(scenario) => scenario.lessonId && handleScenarioClick(scenario.lessonId)}
                    onSeeAll={() => handleCollectionClick(collection)}
                  />
                </div>
              );
            })}

            {/* Empty State */}
            {!loading && collections.length === 0 && (
              <div style={{ padding: '0 20px' }}>
                <EmptyState
                  icon="📚"
                  title="No collections available"
                  message={
                    isTeacher
                      ? 'Create collections in your Teacher Dashboard to see them here.'
                      : "Your teacher hasn't created any roleplay collections yet."
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {user && (
        <CreateOwnModal
          isOpen={showCreateOwnModal}
          onClose={() => setShowCreateOwnModal(false)}
          onSubmit={handleCreateOwnSubmit}
          userId={user.uid}
        />
      )}

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
