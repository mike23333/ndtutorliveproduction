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
} from '../components/roleplay';

// === Data Types ===
interface LevelData {
  icon: string;
  title: string;
  scenes: number;
  key: LevelKey;
}

interface CollectionData {
  title: string;
  scenes: number;
  illustration: string;
}

interface CategoryData {
  name: string;
  items: ScenarioData[];
}

// === Static Data ===
const LEVELS: LevelData[] = [
  { icon: '🐣', title: 'Beginner', scenes: 26, key: 'beginner' },
  { icon: '📚', title: 'Pre-Intermediate', scenes: 27, key: 'pre-intermediate' },
  { icon: '🎯', title: 'Intermediate', scenes: 24, key: 'intermediate' },
  { icon: '🚀', title: 'Upper-Intermediate', scenes: 18, key: 'upper-intermediate' },
];

const COLLECTIONS: CollectionData[] = [
  { title: 'Restaurant', scenes: 12, illustration: 'restaurant' },
  { title: 'Travel', scenes: 12, illustration: 'travel' },
];

const CATEGORIES: CategoryData[] = [
  {
    name: 'School & Job',
    items: [
      { title: 'Job Interview', type: 'Scenario', level: 'beginner', illustration: 'interview' },
      {
        title: 'Talking About Your Skills',
        type: 'Task',
        level: 'beginner',
        completed: true,
        illustration: 'skills',
      },
    ],
  },
  {
    name: 'Flirting',
    items: [
      { title: 'First Date Tips', type: 'Scenario', level: 'beginner', illustration: 'date' },
      {
        title: 'Planning a Romantic Evening',
        type: 'Scenario',
        level: 'upper-intermediate',
        illustration: 'romantic',
      },
    ],
  },
  {
    name: 'Daily Interactions',
    items: [
      { title: 'Asking for Directions', type: 'Task', level: 'beginner', illustration: 'directions' },
      { title: 'Visiting the Pharmacy', type: 'Task', level: 'pre-intermediate', illustration: 'pharmacy' },
    ],
  },
  {
    name: 'Shopping',
    items: [
      { title: 'Shopping for Clothes', type: 'Task', level: 'pre-intermediate', illustration: 'shopping' },
    ],
  },
  {
    name: 'Travel',
    items: [
      {
        title: 'Ordering at a Restaurant',
        type: 'Task',
        level: 'beginner',
        illustration: 'restaurant-order',
      },
      { title: 'Booking a Hotel Room', type: 'Task', level: 'beginner', illustration: 'hotel' },
    ],
  },
  {
    name: 'Social Dynamics',
    items: [
      { title: 'Meeting New People', type: 'Scenario', level: 'pre-intermediate', illustration: 'social' },
      { title: 'Talking to a Neighbour', type: 'Scenario', level: 'beginner', illustration: 'neighbour' },
    ],
  },
];

// === Header Component ===
function Header({ onBackClick }: { onBackClick: () => void }) {
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
        Role Play
      </h1>
    </header>
  );
}

// === Random Button Component ===
function RandomButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = AppColors.accent;
        e.currentTarget.style.color = AppColors.accent;
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

// === Collection Section ===
function CollectionSection({
  collections,
  onCollectionClick,
  onRandomClick,
}: {
  collections: CollectionData[];
  onCollectionClick: (collection: CollectionData) => void;
  onRandomClick: () => void;
}) {
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
          Collection
        </h2>
        <RandomButton onClick={onRandomClick} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {collections.map((col, idx) => (
          <CollectionCard
            key={idx}
            title={col.title}
            scenes={col.scenes}
            illustration={col.illustration}
            onClick={() => onCollectionClick(col)}
          />
        ))}
      </div>
    </div>
  );
}

// === Main Page Component ===
export default function RolePlayPage() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | null>(null);

  // Filter categories based on selected level
  const filteredCategories = selectedLevel
    ? CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.level === selectedLevel),
      })).filter((cat) => cat.items.length > 0)
    : CATEGORIES;

  const handleLevelClick = useCallback((level: LevelData) => {
    setSelectedLevel((prev) => (prev === level.key ? null : level.key));
  }, []);

  const handleCollectionClick = useCallback(
    (collection: CollectionData) => {
      // Navigate to collection or start scenario
      console.log('Collection clicked:', collection.title);
    },
    []
  );

  const handleRandomClick = useCallback(() => {
    // Pick a random scenario and navigate to its detail page
    const allScenarios = CATEGORIES.flatMap((cat) => cat.items);
    const randomScenario = allScenarios[Math.floor(Math.random() * allScenarios.length)];
    const scenarioId = randomScenario.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/roleplay/${scenarioId}`);
  }, [navigate]);

  const handleScenarioClick = useCallback(
    (scenario: ScenarioData) => {
      // Navigate to scenario detail page
      const scenarioId = scenario.title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/roleplay/${scenarioId}`);
    },
    [navigate]
  );

  const handleCreateScenario = useCallback(() => {
    // Open create scenario modal or navigate
    console.log('Create scenario clicked');
  }, []);

  const handleSeeAll = useCallback((categoryName: string) => {
    console.log('See all clicked for:', categoryName);
  }, []);

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
        @media (min-width: 640px) {
          .roleplay-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .roleplay-content { max-width: 640px; }
        }
      `}</style>

      <Header onBackClick={() => navigate(-1)} />

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
            <span style={{ color: AppColors.textSecondary, fontSize: '14px' }}>
              Filtering by:
            </span>
            <span
              style={{
                color: AppColors.accent,
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
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
        <HorizontalLevelScroller levels={LEVELS} onLevelClick={handleLevelClick} />

        {/* Collection Section */}
        <CollectionSection
          collections={COLLECTIONS}
          onCollectionClick={handleCollectionClick}
          onRandomClick={handleRandomClick}
        />

        {/* Create Your Own Banner */}
        <CreateScenarioBanner onClick={handleCreateScenario} />

        {/* Category Sections */}
        {filteredCategories.map((category, idx) => (
          <CategorySection
            key={idx}
            name={category.name}
            items={category.items}
            onItemClick={handleScenarioClick}
            onSeeAll={() => handleSeeAll(category.name)}
          />
        ))}

        {/* Empty state when filtering */}
        {selectedLevel && filteredCategories.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: AppColors.textSecondary,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ margin: 0, fontSize: '16px' }}>
              No scenarios found for this level.
            </p>
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
        )}
      </div>
    </div>
  );
}
