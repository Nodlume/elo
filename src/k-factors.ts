/**
 * Ready-made K-factor strategies. Each export is a factory returning a
 * `KFactorFn` that picks K from the player's current `Rating`, so different
 * players in the same match can receive different K values.
 */
import type { KFactorFn, Rating } from "./types.js";

/** Returns a strategy that ignores the player and always yields `k`. */
export function constant(k: number): KFactorFn {
  return () => k;
}

/**
 * FIDE-style K-factor:
 * - K=40 for players with fewer than 30 games, regardless of rating
 * - K=10 for players rated 2400+
 * - K=20 for all others
 */
export function fide(): KFactorFn {
  return (player: Rating) => {
    if (player.gamesPlayed < 30) return 40;
    if (player.rating >= 2400) return 10;
    return 20;
  };
}

/**
 * USCF-style K-factor based on rating thresholds:
 * - K=32 below 2100
 * - K=24 between 2100-2399
 * - K=16 at 2400+
 */
export function uscf(): KFactorFn {
  return (player: Rating) => {
    if (player.rating < 2100) return 32;
    if (player.rating < 2400) return 24;
    return 16;
  };
}

/**
 * Linear decay: K starts at `high` and linearly decreases to `low`
 * over the first `games` matches, then stays at `low`. Values in between
 * are fractional, not rounded.
 */
export function linearDecay(high: number, low: number, games: number): KFactorFn {
  return (player: Rating) => {
    if (player.gamesPlayed >= games) return low;
    const t = player.gamesPlayed / games;
    return high + (low - high) * t;
  };
}
