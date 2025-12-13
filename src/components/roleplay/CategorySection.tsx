import { AppColors } from '../../theme/colors';
import { ScenarioItem, ScenarioType, LevelKey } from './ScenarioItem';

export interface ScenarioData {
  title: string;
  type: ScenarioType;
  level: LevelKey;
  illustration: string;
  imageUrl?: string; // Firebase Storage URL for real image
  completed?: boolean;
  lessonId?: string; // Lesson ID for navigation and modal
}

interface CategorySectionProps {
  name: string;
  items: ScenarioData[];
  onItemClick?: (item: ScenarioData) => void;
  onSeeAll?: () => void;
}

export function CategorySection({ name, items, onItemClick, onSeeAll }: CategorySectionProps) {
  // Group items into pairs for the horizontal scroll
  const itemPairs: ScenarioData[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    itemPairs.push(items.slice(i, i + 2));
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.3px',
            margin: 0,
          }}
        >
          {name}
        </h3>
        <button
          onClick={onSeeAll}
          style={{
            background: 'none',
            border: 'none',
            color: AppColors.textSecondary,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = AppColors.accent;
            e.currentTarget.style.background = AppColors.accentMuted;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = AppColors.textSecondary;
            e.currentTarget.style.background = 'none';
          }}
        >
          See All
        </button>
      </div>

      {/* Horizontal scrollable container */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {itemPairs.map((pair, pairIdx) => (
          <div
            key={pairIdx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flexShrink: 0,
              width: 'calc(100% - 24px)',
              minWidth: '280px',
              scrollSnapAlign: 'start',
            }}
          >
            {pair.map((item, idx) => (
              <ScenarioItem
                key={idx}
                title={item.title}
                type={item.type}
                level={item.level}
                illustration={item.illustration}
                imageUrl={item.imageUrl}
                completed={item.completed}
                onClick={() => onItemClick?.(item)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Scroll indicator dots */}
      {itemPairs.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
          }}
        >
          {itemPairs.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: idx === 0 ? AppColors.accent : AppColors.borderColor,
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
