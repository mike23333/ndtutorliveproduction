/**
 * Badge System Test Script
 *
 * Tests badge criteria logic, progress calculations, and edge cases.
 * Run with: npx tsx scripts/test-badges.ts
 */

// ==================== Type Definitions (mirrored from src/types) ====================

type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

type BadgeCategory = 'consistency' | 'excellence' | 'time' | 'explorer' | 'level';

type NumericCriteriaType =
  | 'sessions_completed'
  | 'current_streak'
  | 'total_stars'
  | 'consecutive_five_stars'
  | 'practice_minutes'
  | 'unique_scenarios'
  | 'custom_lessons_created';

type LevelCriteriaType = 'level_reached';

interface NumericBadgeCriteria {
  type: NumericCriteriaType;
  threshold: number;
}

interface LevelBadgeCriteria {
  type: LevelCriteriaType;
  threshold: ProficiencyLevel;
}

type BadgeCriteria = NumericBadgeCriteria | LevelBadgeCriteria;

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
  sortOrder: number;
  criteria: BadgeCriteria;
}

interface UserDocument {
  totalSessions?: number;
  currentStreak?: number;
  longestStreak?: number;
  totalStars?: number;
  consecutiveFiveStarSessions?: number;
  totalPracticeTime?: number; // in SECONDS
  uniqueScenariosCompleted?: string[];
  customLessonsCreated?: number;
  level?: ProficiencyLevel;
  badgeIds?: string[];
}

// ==================== Badge Definitions (copied from badges.ts) ====================

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // CONSISTENCY BADGES (8)
  { id: 'first_steps', name: 'First Steps', description: 'You started your journey', category: 'consistency', iconName: 'Footprints', sortOrder: 1, criteria: { type: 'sessions_completed', threshold: 1 } },
  { id: 'getting_started', name: 'Getting Started', description: 'Building momentum', category: 'consistency', iconName: 'Rocket', sortOrder: 2, criteria: { type: 'sessions_completed', threshold: 5 } },
  { id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Practice makes progress', category: 'consistency', iconName: 'BookOpen', sortOrder: 3, criteria: { type: 'sessions_completed', threshold: 25 } },
  { id: 'century_club', name: 'Century Club', description: '100 conversations strong', category: 'consistency', iconName: 'Trophy', sortOrder: 4, criteria: { type: 'sessions_completed', threshold: 100 } },
  { id: 'streak_starter', name: 'Streak Starter', description: 'Three days in a row', category: 'consistency', iconName: 'Flame', sortOrder: 5, criteria: { type: 'current_streak', threshold: 3 } },
  { id: 'week_warrior', name: 'Week Warrior', description: 'A full week of practice', category: 'consistency', iconName: 'Flame', sortOrder: 6, criteria: { type: 'current_streak', threshold: 7 } },
  { id: 'fortnight_force', name: 'Fortnight Force', description: 'Two weeks unstoppable', category: 'consistency', iconName: 'Flame', sortOrder: 7, criteria: { type: 'current_streak', threshold: 14 } },
  { id: 'month_master', name: 'Month Master', description: '30 days of dedication', category: 'consistency', iconName: 'Crown', sortOrder: 8, criteria: { type: 'current_streak', threshold: 30 } },

  // EXCELLENCE BADGES (5)
  { id: 'rising_star', name: 'Rising Star', description: 'Your first perfect session', category: 'excellence', iconName: 'Star', sortOrder: 1, criteria: { type: 'consecutive_five_stars', threshold: 1 } },
  { id: 'star_collector', name: 'Star Collector', description: '50 stars earned', category: 'excellence', iconName: 'Stars', sortOrder: 2, criteria: { type: 'total_stars', threshold: 50 } },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Excellence sustained', category: 'excellence', iconName: 'Medal', sortOrder: 3, criteria: { type: 'consecutive_five_stars', threshold: 3 } },
  { id: 'constellation', name: 'Constellation', description: 'A sky full of stars', category: 'excellence', iconName: 'Sparkles', sortOrder: 4, criteria: { type: 'total_stars', threshold: 100 } },
  { id: 'supernova', name: 'Supernova', description: 'Brilliance personified', category: 'excellence', iconName: 'Sun', sortOrder: 5, criteria: { type: 'total_stars', threshold: 250 } },

  // TIME BADGES (4)
  { id: 'first_hour', name: 'First Hour', description: 'Your first hour', category: 'time', iconName: 'Clock', sortOrder: 1, criteria: { type: 'practice_minutes', threshold: 60 } },
  { id: 'five_hours', name: 'Five Hours', description: 'Five hours invested', category: 'time', iconName: 'Clock', sortOrder: 2, criteria: { type: 'practice_minutes', threshold: 300 } },
  { id: 'ten_hours', name: 'Ten Hours', description: 'Double digits', category: 'time', iconName: 'Hourglass', sortOrder: 3, criteria: { type: 'practice_minutes', threshold: 600 } },
  { id: 'marathon_learner', name: 'Marathon Learner', description: 'A true marathon', category: 'time', iconName: 'Timer', sortOrder: 4, criteria: { type: 'practice_minutes', threshold: 1000 } },

  // EXPLORER BADGES (5)
  { id: 'explorer', name: 'Explorer', description: 'Trying new things', category: 'explorer', iconName: 'Compass', sortOrder: 1, criteria: { type: 'unique_scenarios', threshold: 5 } },
  { id: 'adventurer', name: 'Adventurer', description: 'Expanding horizons', category: 'explorer', iconName: 'Map', sortOrder: 2, criteria: { type: 'unique_scenarios', threshold: 15 } },
  { id: 'world_traveler', name: 'World Traveler', description: 'Been everywhere', category: 'explorer', iconName: 'Globe', sortOrder: 3, criteria: { type: 'unique_scenarios', threshold: 30 } },
  { id: 'creator', name: 'Creator', description: 'Made it your own', category: 'explorer', iconName: 'Pencil', sortOrder: 4, criteria: { type: 'custom_lessons_created', threshold: 1 } },
  { id: 'lesson_architect', name: 'Lesson Architect', description: 'Building your curriculum', category: 'explorer', iconName: 'Layout', sortOrder: 5, criteria: { type: 'custom_lessons_created', threshold: 5 } },

  // LEVEL BADGES (5)
  { id: 'level_a2', name: 'Breakthrough', description: 'Reached A2 level', category: 'level', iconName: 'TrendingUp', sortOrder: 1, criteria: { type: 'level_reached', threshold: 'A2' } },
  { id: 'level_b1', name: 'Intermediate', description: 'Reached B1 level', category: 'level', iconName: 'TrendingUp', sortOrder: 2, criteria: { type: 'level_reached', threshold: 'B1' } },
  { id: 'level_b2', name: 'Upper Intermediate', description: 'Reached B2 level', category: 'level', iconName: 'Mountain', sortOrder: 3, criteria: { type: 'level_reached', threshold: 'B2' } },
  { id: 'level_c1', name: 'Advanced', description: 'Reached C1 level', category: 'level', iconName: 'Mountain', sortOrder: 4, criteria: { type: 'level_reached', threshold: 'C1' } },
  { id: 'level_c2', name: 'Mastery', description: 'Reached C2 level', category: 'level', iconName: 'Award', sortOrder: 5, criteria: { type: 'level_reached', threshold: 'C2' } },
];

// ==================== Helper Functions ====================

const LEVEL_ORDER: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const hasReachedLevel = (currentLevel: ProficiencyLevel | undefined, targetLevel: ProficiencyLevel): boolean => {
  if (!currentLevel) return false;
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  const targetIndex = LEVEL_ORDER.indexOf(targetLevel);
  return currentIndex >= targetIndex;
};

/**
 * Check if user meets criteria for a badge
 * THIS IS THE MAIN FUNCTION BEING TESTED
 */
const meetsCriteria = (criteria: BadgeCriteria, userData: UserDocument): boolean => {
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
const getProgressValue = (criteria: BadgeCriteria, userData: UserDocument): number => {
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
      return userData.level ? LEVEL_ORDER.indexOf(userData.level) : 0;
    default:
      return 0;
  }
};

/**
 * Get target value for a badge criteria
 */
const getTargetValue = (criteria: BadgeCriteria): number => {
  if (criteria.type === 'level_reached') {
    return LEVEL_ORDER.indexOf(criteria.threshold);
  }
  return criteria.threshold;
};

/**
 * Calculate progress percentage
 */
const getProgressPercent = (criteria: BadgeCriteria, userData: UserDocument): number => {
  const progress = getProgressValue(criteria, userData);
  const target = getTargetValue(criteria);
  if (target === 0) return 0;
  return Math.min(100, Math.round((progress / target) * 100));
};

// ==================== Test Framework ====================

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error: any) {
    results.push({ name, passed: false, message: error.message });
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be < ${expected}`);
      }
    },
    toBeTrue() {
      if (actual !== true) {
        throw new Error(`Expected true, got ${actual}`);
      }
    },
    toBeFalse() {
      if (actual !== false) {
        throw new Error(`Expected false, got ${actual}`);
      }
    },
  };
}

// ==================== Test Cases ====================

console.log('\n🧪 BADGE SYSTEM TESTS\n');
console.log('='.repeat(60));

// ---------- BADGE DEFINITIONS TESTS ----------

console.log('\n📋 Badge Definitions\n');

test('Should have 27 total badges', () => {
  expect(BADGE_DEFINITIONS.length).toBe(27);
});

test('Should have 8 consistency badges', () => {
  const count = BADGE_DEFINITIONS.filter(b => b.category === 'consistency').length;
  expect(count).toBe(8);
});

test('Should have 5 excellence badges', () => {
  const count = BADGE_DEFINITIONS.filter(b => b.category === 'excellence').length;
  expect(count).toBe(5);
});

test('Should have 4 time badges', () => {
  const count = BADGE_DEFINITIONS.filter(b => b.category === 'time').length;
  expect(count).toBe(4);
});

test('Should have 5 explorer badges', () => {
  const count = BADGE_DEFINITIONS.filter(b => b.category === 'explorer').length;
  expect(count).toBe(5);
});

test('Should have 5 level badges', () => {
  const count = BADGE_DEFINITIONS.filter(b => b.category === 'level').length;
  expect(count).toBe(5);
});

test('All badges should have unique IDs', () => {
  const ids = BADGE_DEFINITIONS.map(b => b.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(ids.length);
});

// ---------- SESSIONS COMPLETED TESTS ----------

console.log('\n🎯 Sessions Completed Criteria\n');

test('First Steps badge: 0 sessions should not qualify', () => {
  const user: UserDocument = { totalSessions: 0 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'first_steps')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('First Steps badge: 1 session should qualify', () => {
  const user: UserDocument = { totalSessions: 1 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'first_steps')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Getting Started badge: 4 sessions should not qualify', () => {
  const user: UserDocument = { totalSessions: 4 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'getting_started')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Getting Started badge: 5 sessions should qualify', () => {
  const user: UserDocument = { totalSessions: 5 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'getting_started')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Century Club badge: 99 sessions should not qualify', () => {
  const user: UserDocument = { totalSessions: 99 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'century_club')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Century Club badge: 100 sessions should qualify', () => {
  const user: UserDocument = { totalSessions: 100 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'century_club')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- STREAK TESTS (CRITICAL - USES MAX OF CURRENT AND LONGEST) ----------

console.log('\n🔥 Streak Criteria (uses max of current and longest)\n');

test('Streak badge: currentStreak=3 should qualify for Streak Starter', () => {
  const user: UserDocument = { currentStreak: 3, longestStreak: 0 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'streak_starter')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Streak badge: longestStreak=3 (current=1) should still qualify', () => {
  const user: UserDocument = { currentStreak: 1, longestStreak: 3 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'streak_starter')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Streak badge: Week Warrior needs 7 days', () => {
  const user: UserDocument = { currentStreak: 7, longestStreak: 0 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'week_warrior')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Streak badge: 6 day streak should not qualify for Week Warrior', () => {
  const user: UserDocument = { currentStreak: 6, longestStreak: 6 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'week_warrior')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Streak badge: Month Master with longestStreak=30 (current reset to 1)', () => {
  // User had 30 day streak, then missed a day - should still have badge
  const user: UserDocument = { currentStreak: 1, longestStreak: 30 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'month_master')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- STARS TESTS ----------

console.log('\n⭐ Stars Criteria\n');

test('Star Collector: 49 stars should not qualify', () => {
  const user: UserDocument = { totalStars: 49 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'star_collector')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Star Collector: 50 stars should qualify', () => {
  const user: UserDocument = { totalStars: 50 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'star_collector')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Supernova: 250 stars should qualify', () => {
  const user: UserDocument = { totalStars: 250 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'supernova')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- CONSECUTIVE FIVE STARS TESTS ----------

console.log('\n✨ Consecutive Five Star Sessions\n');

test('Rising Star: 1 consecutive 5-star session should qualify', () => {
  const user: UserDocument = { consecutiveFiveStarSessions: 1 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'rising_star')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Perfectionist: 2 consecutive 5-star should not qualify (needs 3)', () => {
  const user: UserDocument = { consecutiveFiveStarSessions: 2 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'perfectionist')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Perfectionist: 3 consecutive 5-star should qualify', () => {
  const user: UserDocument = { consecutiveFiveStarSessions: 3 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'perfectionist')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- PRACTICE TIME TESTS (CRITICAL - SECONDS TO MINUTES CONVERSION) ----------

console.log('\n⏱️  Practice Time Criteria (stored in seconds, checked in minutes)\n');

test('First Hour: 59 minutes (3540 seconds) should not qualify', () => {
  const user: UserDocument = { totalPracticeTime: 3540 }; // 59 * 60 = 3540 seconds
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'first_hour')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('First Hour: 60 minutes (3600 seconds) should qualify', () => {
  const user: UserDocument = { totalPracticeTime: 3600 }; // 60 * 60 = 3600 seconds
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'first_hour')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Five Hours: 299 minutes should not qualify', () => {
  const user: UserDocument = { totalPracticeTime: 299 * 60 }; // 299 minutes in seconds
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'five_hours')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Five Hours: 300 minutes should qualify', () => {
  const user: UserDocument = { totalPracticeTime: 300 * 60 }; // 5 hours in seconds
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'five_hours')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Marathon Learner: 1000 minutes (60000 seconds) should qualify', () => {
  const user: UserDocument = { totalPracticeTime: 60000 }; // 1000 * 60 = 60000 seconds
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'marathon_learner')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- UNIQUE SCENARIOS TESTS ----------

console.log('\n🗺️  Unique Scenarios Criteria\n');

test('Explorer: 4 scenarios should not qualify', () => {
  const user: UserDocument = { uniqueScenariosCompleted: ['a', 'b', 'c', 'd'] };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'explorer')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Explorer: 5 scenarios should qualify', () => {
  const user: UserDocument = { uniqueScenariosCompleted: ['a', 'b', 'c', 'd', 'e'] };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'explorer')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('World Traveler: 30 scenarios should qualify', () => {
  const scenarios = Array.from({ length: 30 }, (_, i) => `scenario-${i}`);
  const user: UserDocument = { uniqueScenariosCompleted: scenarios };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'world_traveler')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- CUSTOM LESSONS TESTS ----------

console.log('\n✏️  Custom Lessons Created Criteria\n');

test('Creator: 0 lessons should not qualify', () => {
  const user: UserDocument = { customLessonsCreated: 0 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'creator')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Creator: 1 lesson should qualify', () => {
  const user: UserDocument = { customLessonsCreated: 1 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'creator')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Lesson Architect: 5 lessons should qualify', () => {
  const user: UserDocument = { customLessonsCreated: 5 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'lesson_architect')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

// ---------- LEVEL TESTS ----------

console.log('\n📊 Level Reached Criteria\n');

test('Level A2 badge: A1 level should not qualify', () => {
  const user: UserDocument = { level: 'A1' };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_a2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Level A2 badge: A2 level should qualify', () => {
  const user: UserDocument = { level: 'A2' };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_a2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Level A2 badge: B1 level should also qualify (higher level)', () => {
  const user: UserDocument = { level: 'B1' };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_a2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Level C2 badge: C1 level should not qualify', () => {
  const user: UserDocument = { level: 'C1' };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_c2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

test('Level C2 badge: C2 level should qualify', () => {
  const user: UserDocument = { level: 'C2' };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_c2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeTrue();
});

test('Level badge: undefined level should not qualify', () => {
  const user: UserDocument = {};
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'level_a2')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

// ---------- PROGRESS CALCULATION TESTS ----------

console.log('\n📈 Progress Calculation Tests\n');

test('Progress: 25/50 stars should be 50%', () => {
  const user: UserDocument = { totalStars: 25 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'star_collector')!;
  expect(getProgressPercent(badge.criteria, user)).toBe(50);
});

test('Progress: 75/100 stars should be 75%', () => {
  const user: UserDocument = { totalStars: 75 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'constellation')!;
  expect(getProgressPercent(badge.criteria, user)).toBe(75);
});

test('Progress: 30 minutes (1800 sec) / 60 min threshold = 50%', () => {
  const user: UserDocument = { totalPracticeTime: 1800 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'first_hour')!;
  expect(getProgressPercent(badge.criteria, user)).toBe(50);
});

test('Progress: should cap at 100%', () => {
  const user: UserDocument = { totalStars: 500 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'star_collector')!;
  expect(getProgressPercent(badge.criteria, user)).toBe(100);
});

test('Progress: streak should use max(current, longest)', () => {
  const user: UserDocument = { currentStreak: 2, longestStreak: 5 };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'week_warrior')!;
  const progress = getProgressValue(badge.criteria, user);
  expect(progress).toBe(5); // Should use longest, not current
});

// ---------- EDGE CASES ----------

console.log('\n🔍 Edge Cases\n');

test('Empty user document should not crash', () => {
  const user: UserDocument = {};
  for (const badge of BADGE_DEFINITIONS) {
    // Should not throw
    meetsCriteria(badge.criteria, user);
    getProgressValue(badge.criteria, user);
    getProgressPercent(badge.criteria, user);
  }
  expect(true).toBeTrue();
});

test('User with undefined arrays should not crash', () => {
  const user: UserDocument = {
    totalSessions: 10,
    uniqueScenariosCompleted: undefined,
    badgeIds: undefined,
  };
  const badge = BADGE_DEFINITIONS.find(b => b.id === 'explorer')!;
  expect(meetsCriteria(badge.criteria, user)).toBeFalse();
});

// ---------- COMPREHENSIVE USER TEST ----------

console.log('\n👤 Comprehensive User Simulation\n');

test('Active user should qualify for multiple badges', () => {
  const activeUser: UserDocument = {
    totalSessions: 30,
    currentStreak: 8,
    longestStreak: 15,
    totalStars: 120,
    consecutiveFiveStarSessions: 2,
    totalPracticeTime: 4500, // 75 minutes
    uniqueScenariosCompleted: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    customLessonsCreated: 2,
    level: 'B1',
    badgeIds: [],
  };

  const earnedBadges = BADGE_DEFINITIONS.filter(badge =>
    meetsCriteria(badge.criteria, activeUser)
  );

  // This user should have:
  // - first_steps, getting_started, dedicated_learner (sessions: 30)
  // - streak_starter, week_warrior, fortnight_force (longest: 15)
  // - rising_star (consecutive 5-star: 2 >= 1)
  // - star_collector, constellation (stars: 120)
  // - first_hour (time: 75 min)
  // - explorer (7 scenarios)
  // - creator (2 custom lessons)
  // - level_a2, level_b1 (level: B1)

  const expectedBadges = [
    'first_steps', 'getting_started', 'dedicated_learner',
    'streak_starter', 'week_warrior', 'fortnight_force',
    'rising_star', 'star_collector', 'constellation',
    'first_hour', 'explorer', 'creator',
    'level_a2', 'level_b1',
  ];

  expect(earnedBadges.length).toBe(expectedBadges.length);

  for (const badgeId of expectedBadges) {
    const found = earnedBadges.find(b => b.id === badgeId);
    if (!found) {
      throw new Error(`Expected badge ${badgeId} to be earned`);
    }
  }
});

// ==================== Print Results ====================

console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST RESULTS\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

for (const result of results) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (!result.passed && result.message) {
    console.log(`   └─ ${result.message}`);
  }
}

console.log('\n' + '-'.repeat(60));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${results.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed!\n');
  process.exit(1);
}
