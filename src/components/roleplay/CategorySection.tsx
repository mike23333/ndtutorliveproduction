import { AppColors } from '../../theme/colors';
import { ScenarioItem, ScenarioType, LevelKey } from './ScenarioItem';

export interface ScenarioData {
  title: string;
  type: ScenarioType;
  level: LevelKey;
  illustration: string;
  completed?: boolean;
}

interface CategorySectionProps {
  name: string;
  items: ScenarioData[];
  onItemClick?: (item: ScenarioData) => void;
  onSeeAll?: () => void;
}

export function CategorySection({ name, items, onItemClick, onSeeAll }: CategorySectionProps) {
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, idx) => (
          <ScenarioItem
            key={idx}
            title={item.title}
            type={item.type}
            level={item.level}
            illustration={item.illustration}
            completed={item.completed}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>
    </div>
  );
}
