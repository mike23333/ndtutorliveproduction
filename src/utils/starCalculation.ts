/**
 * Calculate star rating based on mistake count.
 *
 * Rating scale:
 * - 0 mistakes = 5 stars
 * - 1-3 mistakes = 4 stars
 * - 4-6 mistakes = 3 stars
 * - 7-9 mistakes = 2 stars
 * - 10+ mistakes = 1 star
 */
export function calculateStarsFromMistakes(mistakeCount: number): 1 | 2 | 3 | 4 | 5 {
  if (mistakeCount === 0) return 5;
  if (mistakeCount <= 3) return 4;
  if (mistakeCount <= 6) return 3;
  if (mistakeCount <= 9) return 2;
  return 1;
}
