/**
 * Shared data shapes for Elo rating: head-to-head and free-for-all match
 * inputs, per-player rating state, per-match update results, and pool
 * configuration including pluggable K-factor strategies.
 */

/** Outcome from the perspective of player A. */
export type Outcome = 1 | 0.5 | 0;

/** A recorded match between two players. */
export interface Match {
  playerA: string;
  playerB: string;
  outcome: Outcome;
  timestamp?: number;
}

/** Rating snapshot for a player. */
export interface Rating {
  id: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

/** Result of a rating update after a match. */
export interface UpdateResult {
  playerA: RatingDelta;
  playerB: RatingDelta;
}

/**
 * One player's side of an {@link UpdateResult}: the rating before and after
 * the match, plus the signed change between them.
 */
export interface RatingDelta {
  id: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

/** K-factor strategy: returns K given a player's current state. */
export type KFactorFn = (player: Rating) => number;

/** Configuration for a RatingPool. */
export interface PoolConfig {
  /** Starting rating for new players. Default: 1500. */
  initialRating?: number;
  /** K-factor or strategy function. Default: 32. */
  kFactor?: number | KFactorFn;
  /** Minimum rating floor. Default: none. */
  minRating?: number;
  /** Maximum rating ceiling. Default: none. */
  maxRating?: number;
}

/** One player's result in a multi-player match: an `{ id, score }` object. Higher score = better. */
export interface FreeForAllEntry {
  id: string;
  /** Numeric score or placement. Higher = better. */
  score: number;
}
