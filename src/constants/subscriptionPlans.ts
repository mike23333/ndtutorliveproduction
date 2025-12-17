/**
 * Subscription Plans Configuration
 *
 * Defines the tiered subscription system with weekly Gemini time limits.
 * - Starter: 1 hour/week (default for new students)
 * - Plus: 2 hours/week
 * - Unlimited: No restrictions
 */

import type { SubscriptionPlan } from '../types/firestore';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name: string;
  weeklyLimitSeconds: number;
  description: string;
  color: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    weeklyLimitSeconds: 3600, // 1 hour
    description: '1 hour per week',
    color: '#4ade80', // Green
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    weeklyLimitSeconds: 7200, // 2 hours
    description: '2 hours per week',
    color: '#60a5fa', // Blue
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    weeklyLimitSeconds: Infinity,
    description: 'No limits',
    color: '#d8b4fe', // Purple (matches app accent)
  },
} as const;

/**
 * Default plan for new students
 */
export const DEFAULT_PLAN: SubscriptionPlan = 'starter';

/**
 * Warning threshold - show warning when this percentage of quota remains
 * 0.10 = 10% remaining
 */
export const WARNING_THRESHOLD_PERCENT = 0.10;

/**
 * Get plan config by ID with fallback to default
 */
export function getPlanConfig(plan: SubscriptionPlan | undefined): SubscriptionPlanConfig {
  return SUBSCRIPTION_PLANS[plan || DEFAULT_PLAN];
}

/**
 * Format seconds into human-readable time string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === Infinity) return 'Unlimited';
  if (seconds <= 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Format seconds into short time string (for compact displays)
 */
export function formatTimeShort(seconds: number): string {
  if (seconds === Infinity) return 'Unlimited';
  if (seconds <= 0) return '0m';

  const mins = Math.ceil(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins}m`;
}
