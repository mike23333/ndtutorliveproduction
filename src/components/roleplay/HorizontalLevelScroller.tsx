import { useRef, useState, useEffect, useCallback } from 'react';
import { AppColors } from '../../theme/colors';
import { LevelCard } from './LevelCard';

interface BaseLevelData {
  icon: string;
  title: string;
  scenes: number;
}

interface HorizontalLevelScrollerProps<T extends BaseLevelData> {
  levels: T[];
  onLevelClick?: (level: T, index: number) => void;
}

export function HorizontalLevelScroller<T extends BaseLevelData>({
  levels,
  onLevelClick,
}: HorizontalLevelScrollerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div style={{ position: 'relative', marginBottom: '32px' }}>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color: AppColors.textPrimary,
          marginBottom: '16px',
          letterSpacing: '-0.5px',
        }}
      >
        Language Level
      </h2>

      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          style={{
            position: 'absolute',
            left: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: AppColors.bgElevated,
            color: AppColors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          style={{
            position: 'absolute',
            right: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: AppColors.bgElevated,
            color: AppColors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '4px',
        }}
      >
        <style>{`
          .level-scroller::-webkit-scrollbar { display: none; }
        `}</style>
        {levels.map((level, idx) => (
          <div key={idx} style={{ minWidth: '160px', flex: '0 0 auto' }}>
            <LevelCard
              icon={level.icon}
              title={level.title}
              scenes={level.scenes}
              onClick={() => onLevelClick?.(level, idx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
