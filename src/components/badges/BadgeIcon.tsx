/**
 * Badge Icon Component
 *
 * Design inspired by Jony Ive's principles:
 * - Reduction to essence
 * - Subtle depth through layered shadows
 * - Premium material feel (frosted glass, soft metal)
 * - Restrained, sophisticated color
 * - Tactile, touchable quality
 */

import React from 'react';
import type { BadgeCategory } from '../../types/badges';

interface BadgeIconProps {
  iconName: string;
  category: BadgeCategory;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  earned?: boolean;
}

// Sophisticated, muted category colors - like anodized aluminum
const CATEGORY_COLORS: Record<BadgeCategory, {
  primary: string;      // Main icon color
  glow: string;         // Subtle outer glow
  inner: string;        // Inner gradient highlight
}> = {
  consistency: {
    primary: '#F5D882',     // Soft gold - like brushed brass
    glow: 'rgba(245, 216, 130, 0.15)',
    inner: 'rgba(245, 216, 130, 0.08)',
  },
  excellence: {
    primary: '#C4B5FD',     // Soft lavender - like polished titanium with purple anodize
    glow: 'rgba(196, 181, 253, 0.15)',
    inner: 'rgba(196, 181, 253, 0.08)',
  },
  time: {
    primary: '#93C5FD',     // Soft sky blue - like morning light
    glow: 'rgba(147, 197, 253, 0.15)',
    inner: 'rgba(147, 197, 253, 0.08)',
  },
  explorer: {
    primary: '#86EFAC',     // Soft mint - like sea glass
    glow: 'rgba(134, 239, 172, 0.15)',
    inner: 'rgba(134, 239, 172, 0.08)',
  },
  level: {
    primary: '#DDD6FE',     // Soft violet - like pearl
    glow: 'rgba(221, 214, 254, 0.15)',
    inner: 'rgba(221, 214, 254, 0.08)',
  },
};

// Size configurations
const SIZE_CONFIG = {
  sm: { container: 44, icon: 20, stroke: 1.75 },
  md: { container: 60, icon: 26, stroke: 1.75 },
  lg: { container: 84, icon: 36, stroke: 2 },
  xl: { container: 116, icon: 52, stroke: 2 },
};

/**
 * Icon SVG paths - Lucide-style
 */
const IconPaths: Record<string, React.ReactNode> = {
  // Consistency
  Footprints: (
    <>
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16" />
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6-1.87 0-2.5 1.8-2.5 3.5 0 3.11 2 5.66 2 8.68V20" />
      <path d="M16 17h4" />
      <path d="M4 13h4" />
    </>
  ),
  Rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  BookOpen: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  Trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  Flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  Crown: (
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  ),
  // Excellence
  Star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  Stars: (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </>
  ),
  Medal: (
    <>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 18v-2h-.5" />
    </>
  ),
  Sparkles: (
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  ),
  Sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  // Time
  Clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  Hourglass: (
    <>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </>
  ),
  Timer: (
    <>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </>
  ),
  // Explorer
  Compass: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  Map: (
    <>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </>
  ),
  Globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  Pencil: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  Layout: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="9" x2="9" y1="21" y2="9" />
    </>
  ),
  // Level
  TrendingUp: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  Mountain: (
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  ),
  Award: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </>
  ),
};

const FallbackIcon = <circle cx="12" cy="12" r="6" />;

export function BadgeIcon({
  iconName,
  category,
  size = 'md',
  earned = true,
}: BadgeIconProps) {
  const colors = CATEGORY_COLORS[category];
  const sizeConfig = SIZE_CONFIG[size];
  const iconPath = IconPaths[iconName] || FallbackIcon;

  if (!earned) {
    // Unearned: Simple, muted, almost invisible
    return (
      <div
        style={{
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={sizeConfig.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: sizeConfig.icon,
            height: sizeConfig.icon,
          }}
        >
          {iconPath}
        </svg>
      </div>
    );
  }

  // Earned: Jony Ive-inspired design
  // - Frosted glass effect with subtle depth
  // - Soft, diffused glow (not harsh)
  // - Layered shadows for tactile feel
  // - Icon appears to float slightly above surface
  return (
    <div
      style={{
        width: sizeConfig.container,
        height: sizeConfig.container,
        borderRadius: '50%',
        position: 'relative',
        // Outer glow - very soft, barely there
        boxShadow: `
          0 0 ${sizeConfig.container * 0.4}px ${colors.glow},
          0 0 ${sizeConfig.container * 0.2}px ${colors.glow}
        `,
      }}
    >
      {/* Background layer - frosted glass effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          // Subtle gradient from top-left (light source)
          background: `
            radial-gradient(
              ellipse 80% 50% at 30% 20%,
              rgba(255, 255, 255, 0.12) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 50% 50%,
              ${colors.inner} 0%,
              rgba(255, 255, 255, 0.02) 100%
            )
          `,
          // Layered shadows for depth
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            inset 0 -1px 2px rgba(0, 0, 0, 0.15),
            0 2px 8px rgba(0, 0, 0, 0.2),
            0 1px 2px rgba(0, 0, 0, 0.1)
          `,
          // Very subtle border - like edge of glass
          border: '1px solid rgba(255, 255, 255, 0.08)',
          // Slight backdrop blur for frosted effect
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Inner ring - subtle definition */}
      <div
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: '50%',
          border: `1px solid ${colors.glow}`,
          opacity: 0.5,
        }}
      />

      {/* Icon container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.primary}
          strokeWidth={sizeConfig.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: sizeConfig.icon,
            height: sizeConfig.icon,
            // Subtle drop shadow on icon for depth
            filter: `drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))`,
          }}
        >
          {iconPath}
        </svg>
      </div>
    </div>
  );
}

export default BadgeIcon;
