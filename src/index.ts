/**
 * Public entry point for the Elo rating package. It re-exports the
 * functions from `core`, the `RatingPool` class, and the shared types.
 * The K-factor helpers come out as the `kFactors` namespace, not as
 * top-level names. The types are exported with `export type`, so they
 * are erased at compile time and add nothing to the runtime bundle.
 */
export { expectedScore, newRating, rateMatch } from "./core.js";
export { RatingPool } from "./pool.js";
export * as kFactors from "./k-factors.js";
export type {
  Outcome,
  Match,
  Rating,
  UpdateResult,
  RatingDelta,
  KFactorFn,
  PoolConfig,
  FreeForAllEntry,
} from "./types.js";
