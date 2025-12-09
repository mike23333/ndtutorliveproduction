/**
 * Badge Service
 *
 * Handles badge definitions, checking, and awarding.
 * Uses Firestore transactions to prevent race conditions.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  Timestamp,
  query,
  orderBy,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UserDocument, ProficiencyLevel } from '../../types/firestore';
import type {
  BadgeDefinition,
  BadgeCategory,
  BadgeCriteria,
  UserBadge,
  BadgeCheckResult,
  BadgeProgress,
  BadgeTriggerEvent,
} from '../../types/badges';
import { hasReachedLevel, LEVEL_ORDER } from '../../types/badges';

// ==================== BADGE DEFINITIONS ====================

/**
 * All 27 badge definitions
 * These could also be stored in Firestore, but keeping them in code
 * ensures type safety and avoids extra reads.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ========== CONSISTENCY BADGES (8) ==========
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'You started your journey',
    category: 'consistency',
    iconName: 'Footprints',
    sortOrder: 1,
    criteria: { type: 'sessions_completed', threshold: 1 },
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Building momentum',
    category: 'consistency',
    iconName: 'Rocket',
    sortOrder: 2,
    criteria: { type: 'sessions_completed', threshold: 5 },
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Practice makes progress',
    category: 'consistency',
    iconName: 'BookOpen',
    sortOrder: 3,
    criteria: { type: 'sessions_completed', threshold: 25 },
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: '100 conversations strong',
    category: 'consistency',
    iconName: 'Trophy',
    sortOrder: 4,
    criteria: { type: 'sessions_completed', threshold: 100 },
  },
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Three days in a row',
    category: 'consistency',
    iconName: 'Flame',
    sortOrder: 5,
    criteria: { type: 'current_streak', threshold: 3 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'A full week of practice',
    category: 'consistency',
    iconName: 'Flame',
    sortOrder: 6,
    criteria: { type: 'current_streak', threshold: 7 },
  },
  {
    id: 'fortnight_force',
    name: 'Fortnight Force',
    description: 'Two weeks unstoppable',
    category: 'consistency',
    iconName: 'Flame',
    sortOrder: 7,
    criteria: { type: 'current_streak', threshold: 14 },
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: '30 days of dedication',
    category: 'consistency',
    iconName: 'Crown',
    sortOrder: 8,
    criteria: { type: 'current_streak', threshold: 30 },
  },

  // ========== EXCELLENCE BADGES (5) ==========
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Your first perfect session',
    category: 'excellence',
    iconName: 'Star',
    sortOrder: 1,
    criteria: { type: 'consecutive_five_stars', threshold: 1 },
  },
  {
    id: 'star_collector',
    name: 'Star Collector',
    description: '50 stars earned',
    category: 'excellence',
    iconName: 'Stars',
    sortOrder: 2,
    criteria: { type: 'total_stars', threshold: 50 },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Excellence sustained',
    category: 'excellence',
    iconName: 'Medal',
    sortOrder: 3,
    criteria: { type: 'consecutive_five_stars', threshold: 3 },
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'A sky full of stars',
    category: 'excellence',
    iconName: 'Sparkles',
    sortOrder: 4,
    criteria: { type: 'total_stars', threshold: 100 },
  },
  {
    id: 'supernova',
    name: 'Supernova',
    description: 'Brilliance personified',
    category: 'excellence',
    iconName: 'Sun',
    sortOrder: 5,
    criteria: { type: 'total_stars', threshold: 250 },
  },

  // ========== TIME BADGES (4) ==========
  {
    id: 'first_hour',
    name: 'First Hour',
    description: 'Your first hour',
    category: 'time',
    iconName: 'Clock',
    sortOrder: 1,
    criteria: { type: 'practice_minutes', threshold: 60 },
  },
  {
    id: 'five_hours',
    name: 'Five Hours',
    description: 'Five hours invested',
    category: 'time',
    iconName: 'Clock',
    sortOrder: 2,
    criteria: { type: 'practice_minutes', threshold: 300 },
  },
  {
    id: 'ten_hours',
    name: 'Ten Hours',
    description: 'Double digits',
    category: 'time',
    iconName: 'Hourglass',
    sortOrder: 3,
    criteria: { type: 'practice_minutes', threshold: 600 },
  },
  {
    id: 'marathon_learner',
    name: 'Marathon Learner',
    description: 'A true marathon',
    category: 'time',
    iconName: 'Timer',
    sortOrder: 4,
    criteria: { type: 'practice_minutes', threshold: 1000 },
  },

  // ========== EXPLORER BADGES (5) ==========
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Trying new things',
    category: 'explorer',
    iconName: 'Compass',
    sortOrder: 1,
    criteria: { type: 'unique_scenarios', threshold: 5 },
  },
  {
    id: 'adventurer',
    name: 'Adventurer',
    description: 'Expanding horizons',
    category: 'explorer',
    iconName: 'Map',
    sortOrder: 2,
    criteria: { type: 'unique_scenarios', threshold: 15 },
  },
  {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Been everywhere',
    category: 'explorer',
    iconName: 'Globe',
    sortOrder: 3,
    criteria: { type: 'unique_scenarios', threshold: 30 },
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Made it your own',
    category: 'explorer',
    iconName: 'Pencil',
    sortOrder: 4,
    criteria: { type: 'custom_lessons_created', threshold: 1 },
  },
  {
    id: 'lesson_architect',
    name: 'Lesson Architect',
    description: 'Building your curriculum',
    category: 'explorer',
    iconName: 'Layout',
    sortOrder: 5,
    criteria: { type: 'custom_lessons_created', threshold: 5 },
  },

  // ========== LEVEL BADGES (5) ==========
  {
    id: 'level_a2',
    name: 'Breakthrough',
    description: 'Reached A2 level',
    category: 'level',
    iconName: 'TrendingUp',
    sortOrder: 1,
    criteria: { type: 'level_reached', threshold: 'A2' },
  },
  {
    id: 'level_b1',
    name: 'Intermediate',
    description: 'Reached B1 level',
    category: 'level',
    iconName: 'TrendingUp',
    sortOrder: 2,
    criteria: { type: 'level_reached', threshold: 'B1' },
  },
  {
    id: 'level_b2',
    name: 'Upper Intermediate',
    description: 'Reached B2 level',
    category: 'level',
    iconName: 'Mountain',
    sortOrder: 3,
    criteria: { type: 'level_reached', threshold: 'B2' },
  },
  {
    id: 'level_c1',
    name: 'Advanced',
    description: 'Reached C1 level',
    category: 'level',
    iconName: 'Mountain',
    sortOrder: 4,
    criteria: { type: 'level_reached', threshold: 'C1' },
  },
  {
    id: 'level_c2',
    name: 'Mastery',
    description: 'Reached C2 level',
    category: 'level',
    iconName: 'Award',
    sortOrder: 5,
    criteria: { type: 'level_reached', threshold: 'C2' },
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get badges relevant to a trigger event
 */
const getBadgesForTrigger = (trigger: BadgeTriggerEvent): BadgeDefinition[] => {
  switch (trigger) {
    case 'session_completed':
      // Check consistency, time, explorer (scenarios), and excellence badges
      return BADGE_DEFINITIONS.filter((b) =>
        ['consistency', 'time', 'excellence', 'explorer'].includes(b.category) &&
        b.criteria.type !== 'custom_lessons_created'
      );
    case 'custom_lesson_created':
      // Check explorer badges for custom lessons
      return BADGE_DEFINITIONS.filter(
        (b) => b.criteria.type === 'custom_lessons_created'
      );
    case 'level_changed':
      // Check level progression badges
      return BADGE_DEFINITIONS.filter((b) => b.category === 'level');
    default:
      return [];
  }
};

/**
 * Check if user meets criteria for a badge
 */
const meetsCriteria = (
  criteria: BadgeCriteria,
  userData: UserDocument
): boolean => {
  switch (criteria.type) {
    case 'sessions_completed':
      return (userData.totalSessions || 0) >= criteria.threshold;

    case 'current_streak':
      // Check BOTH current and longest streak (fixes the reset issue)
      const currentStreak = userData.currentStreak || 0;
      const longestStreak = userData.longestStreak || 0;
      return Math.max(currentStreak, longestStreak) >= criteria.threshold;

    case 'total_stars':
      return (userData.totalStars || 0) >= criteria.threshold;

    case 'consecutive_five_stars':
      return (userData.consecutiveFiveStarSessions || 0) >= criteria.threshold;

    case 'practice_minutes':
      // IMPORTANT: userData stores seconds, convert to minutes
      const practiceMinutes = (userData.totalPracticeTime || 0) / 60;
      return practiceMinutes >= criteria.threshold;

    case 'unique_scenarios':
      return (userData.uniqueScenariosCompleted?.length || 0) >= criteria.threshold;

    case 'custom_lessons_created':
      return (userData.customLessonsCreated || 0) >= criteria.threshold;

    case 'level_reached':
      return hasReachedLevel(userData.level, criteria.threshold);

    default:
      return false;
  }
};

/**
 * Get current progress value for a badge criteria
 */
const getProgressValue = (
  criteria: BadgeCriteria,
  userData: UserDocument
): number => {
  switch (criteria.type) {
    case 'sessions_completed':
      return userData.totalSessions || 0;
    case 'current_streak':
      return Math.max(userData.currentStreak || 0, userData.longestStreak || 0);
    case 'total_stars':
      return userData.totalStars || 0;
    case 'consecutive_five_stars':
      return userData.consecutiveFiveStarSessions || 0;
    case 'practice_minutes':
      return Math.floor((userData.totalPracticeTime || 0) / 60);
    case 'unique_scenarios':
      return userData.uniqueScenariosCompleted?.length || 0;
    case 'custom_lessons_created':
      return userData.customLessonsCreated || 0;
    case 'level_reached':
      // Return level index for progress calculation (0 = A1, 1 = A2, etc.)
      // Note: If user has no level set, they're at "starting point" (before A1)
      return userData.level ? LEVEL_ORDER.indexOf(userData.level) + 1 : 0;
    default:
      return 0;
  }
};

// ==================== PUBLIC API ====================

/**
 * Check and award badges for a user based on trigger event
 * Uses Firestore transactions to prevent race conditions
 */
export const checkAndAwardBadges = async (
  userId: string,
  trigger: BadgeTriggerEvent
): Promise<BadgeCheckResult> => {
  if (!db) throw new Error('Firebase not configured');

  const result: BadgeCheckResult = {
    newlyEarned: [],
    alreadyEarned: [],
  };

  const relevantBadges = getBadgesForTrigger(trigger);
  if (relevantBadges.length === 0) return result;

  try {
    await runTransaction(db!, async (transaction) => {
      // Get user document
      const userRef = doc(db!, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        console.warn('[Badges] User not found:', userId);
        return;
      }

      const userData = userSnap.data() as UserDocument;
      const earnedBadgeIds = userData.badgeIds || [];

      // Check each relevant badge
      for (const badge of relevantBadges) {
        if (earnedBadgeIds.includes(badge.id)) {
          result.alreadyEarned.push(badge.id);
          continue;
        }

        if (meetsCriteria(badge.criteria, userData)) {
          // Award the badge
          const userBadgeRef = doc(db!, `users/${userId}/badges`, badge.id);
          const now = Timestamp.now();

          const userBadge: UserBadge = {
            badgeId: badge.id,
            earnedAt: now,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            iconName: badge.iconName,
          };

          transaction.set(userBadgeRef, userBadge);

          // Update user document
          transaction.update(userRef, {
            badgeIds: arrayUnion(badge.id),
            badgeCount: increment(1),
            latestBadge: {
              id: badge.id,
              name: badge.name,
              iconName: badge.iconName,
              earnedAt: now,
            },
          });

          result.newlyEarned.push(badge);
          console.log('[Badges] Awarded badge:', badge.name, 'to user:', userId);
        }
      }
    });
  } catch (error) {
    console.error('[Badges] Error checking badges:', error);
    throw error;
  }

  return result;
};

/**
 * Get all badges earned by a user
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  if (!db) throw new Error('Firebase not configured');

  const badgesRef = collection(db, `users/${userId}/badges`);
  const q = query(badgesRef, orderBy('earnedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as UserBadge);
};

/**
 * Get badge progress for all badges
 * Also checks if criteria are met for badges not yet in badgeIds (handles retroactive earning)
 */
export const getBadgeProgress = async (
  userId: string
): Promise<BadgeProgress[]> => {
  if (!db) throw new Error('Firebase not configured');

  // Get user data
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return BADGE_DEFINITIONS.map((badge) => ({
      badge,
      earned: false,
      progress: 0,
      target: badge.criteria.type === 'level_reached'
        ? LEVEL_ORDER.indexOf(badge.criteria.threshold as ProficiencyLevel)
        : (badge.criteria as { threshold: number }).threshold,
      progressPercent: 0,
    }));
  }

  const userData = userSnap.data() as UserDocument;
  const earnedBadgeIds = userData.badgeIds || [];

  // Get earned badges with dates
  const earnedBadges = await getUserBadges(userId);
  const earnedBadgeMap = new Map(earnedBadges.map((b) => [b.badgeId, b]));

  // Track badges that should be awarded retroactively
  const badgesToAward: BadgeDefinition[] = [];

  const progressList = BADGE_DEFINITIONS.map((badge) => {
    // Check if in badgeIds OR if criteria are met (handles retroactive)
    const inBadgeIds = earnedBadgeIds.includes(badge.id);
    const criteriaMet = meetsCriteria(badge.criteria, userData);
    const earned = inBadgeIds || criteriaMet;

    // Track badges that need retroactive awarding
    if (criteriaMet && !inBadgeIds) {
      badgesToAward.push(badge);
    }

    const earnedBadge = earnedBadgeMap.get(badge.id);
    const progress = getProgressValue(badge.criteria, userData);

    let target: number;
    if (badge.criteria.type === 'level_reached') {
      // Level badges: target is the index + 1 (so A2 = 2, B1 = 3, etc.)
      target = LEVEL_ORDER.indexOf(badge.criteria.threshold as ProficiencyLevel) + 1;
    } else {
      target = (badge.criteria as { threshold: number }).threshold;
    }

    const progressPercent = Math.min(100, Math.round((progress / target) * 100));

    return {
      badge,
      earned,
      earnedAt: earnedBadge?.earnedAt.toDate(),
      progress,
      target,
      progressPercent,
    };
  });

  // Award badges retroactively in background (don't await to keep UI fast)
  if (badgesToAward.length > 0) {
    awardBadgesRetroactively(userId, badgesToAward).catch((err) =>
      console.warn('[Badges] Error awarding retroactive badges:', err)
    );
  }

  return progressList;
};

/**
 * Award badges that user qualifies for but weren't previously awarded
 * (handles users who had progress before badge system was implemented)
 */
const awardBadgesRetroactively = async (
  userId: string,
  badges: BadgeDefinition[]
): Promise<void> => {
  if (!db || badges.length === 0) return;

  console.log('[Badges] Awarding retroactive badges:', badges.map(b => b.name).join(', '));

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db!, 'users', userId);
      const now = Timestamp.now();

      for (const badge of badges) {
        // Create badge document
        const userBadgeRef = doc(db!, `users/${userId}/badges`, badge.id);

        const userBadge: UserBadge = {
          badgeId: badge.id,
          earnedAt: now,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          iconName: badge.iconName,
        };

        transaction.set(userBadgeRef, userBadge);
      }

      // Update user document with all badge IDs at once
      transaction.update(userRef, {
        badgeIds: arrayUnion(...badges.map(b => b.id)),
        badgeCount: increment(badges.length),
        latestBadge: {
          id: badges[badges.length - 1].id,
          name: badges[badges.length - 1].name,
          iconName: badges[badges.length - 1].iconName,
          earnedAt: now,
        },
      });
    });

    console.log('[Badges] Retroactive badges awarded successfully');
  } catch (error) {
    console.error('[Badges] Error in retroactive badge award:', error);
    throw error;
  }
};

/**
 * Get badges grouped by category
 */
export const getBadgesByCategory = (): Record<BadgeCategory, BadgeDefinition[]> => {
  const grouped: Record<BadgeCategory, BadgeDefinition[]> = {
    consistency: [],
    excellence: [],
    time: [],
    explorer: [],
    level: [],
  };

  for (const badge of BADGE_DEFINITIONS) {
    grouped[badge.category].push(badge);
  }

  // Sort by sortOrder within each category
  for (const category of Object.keys(grouped) as BadgeCategory[]) {
    grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return grouped;
};

/**
 * Get a single badge definition by ID
 */
export const getBadgeById = (badgeId: string): BadgeDefinition | undefined => {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId);
};

/**
 * Get category display info
 */
export const CATEGORY_INFO: Record<BadgeCategory, { name: string; description: string }> = {
  consistency: { name: 'Consistency', description: 'Building habits through regular practice' },
  excellence: { name: 'Excellence', description: 'Quality of your practice sessions' },
  time: { name: 'Time', description: 'Total time invested in learning' },
  explorer: { name: 'Explorer', description: 'Variety and creativity in your practice' },
  level: { name: 'Level', description: 'CEFR level progression' },
};
