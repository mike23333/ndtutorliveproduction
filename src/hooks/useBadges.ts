/**
 * Badge Hooks
 * Fetch and manage badge data for user profile and badge collection
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserBadges,
  getBadgeProgress,
  getBadgesByCategory,
  BADGE_DEFINITIONS,
  CATEGORY_INFO,
} from '../services/firebase/badges';
import type { UserBadge, BadgeProgress, BadgeCategory, BadgeDefinition } from '../types/badges';

// ==================== useBadges ====================

export interface UseBadgesResult {
  badges: UserBadge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user's earned badges
 */
export function useBadges(userId: string | undefined): UseBadgesResult {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!userId) {
      setBadges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedBadges = await getUserBadges(userId);
      setBadges(fetchedBadges);
    } catch (err) {
      console.error('[useBadges] Error fetching badges:', err);
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges,
  };
}

// ==================== useBadgeProgress ====================

export interface UseBadgeProgressResult {
  progress: BadgeProgress[];
  badgesByCategory: Record<BadgeCategory, BadgeProgress[]>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Stats
  totalBadges: number;
  earnedBadges: number;
  earnedPercent: number;
}

/**
 * Hook to fetch badge progress for all badges
 * Useful for badge collection page showing earned and locked badges
 */
export function useBadgeProgress(userId: string | undefined): UseBadgeProgressResult {
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      // Return empty progress with badge structure
      const emptyProgress = BADGE_DEFINITIONS.map((badge) => ({
        badge,
        earned: false,
        progress: 0,
        target: badge.criteria.type === 'level_reached' ? 0 : (badge.criteria as { threshold: number }).threshold,
        progressPercent: 0,
      }));
      setProgress(emptyProgress);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedProgress = await getBadgeProgress(userId);
      setProgress(fetchedProgress);
    } catch (err) {
      console.error('[useBadgeProgress] Error fetching progress:', err);
      setError('Failed to load badge progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Group by category
  const badgesByCategory: Record<BadgeCategory, BadgeProgress[]> = {
    consistency: [],
    excellence: [],
    time: [],
    explorer: [],
    level: [],
  };

  for (const p of progress) {
    badgesByCategory[p.badge.category].push(p);
  }

  // Sort by sortOrder within each category
  for (const category of Object.keys(badgesByCategory) as BadgeCategory[]) {
    badgesByCategory[category].sort((a, b) => a.badge.sortOrder - b.badge.sortOrder);
  }

  // Calculate stats
  const totalBadges = progress.length;
  const earnedBadges = progress.filter((p) => p.earned).length;
  const earnedPercent = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

  return {
    progress,
    badgesByCategory,
    loading,
    error,
    refetch: fetchProgress,
    totalBadges,
    earnedBadges,
    earnedPercent,
  };
}

// ==================== useRecentBadges ====================

export interface UseRecentBadgesResult {
  recentBadges: UserBadge[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch user's most recent badges (for profile page)
 */
export function useRecentBadges(
  userId: string | undefined,
  limit: number = 5
): UseRecentBadgesResult {
  const { badges, loading, error } = useBadges(userId);

  // Badges are already sorted by earnedAt desc from the service
  const recentBadges = badges.slice(0, limit);

  return {
    recentBadges,
    loading,
    error,
  };
}

// ==================== Re-exports ====================

export { getBadgesByCategory, BADGE_DEFINITIONS, CATEGORY_INFO };
export type { BadgeDefinition, BadgeCategory };
