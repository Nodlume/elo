import type { Outcome } from "./types.js";

/**
 * Expected score of player A against player B.
 * Returns a value between 0 and 1.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * Compute new rating for a player given their K-factor, expected score, and actual outcome.
 */
export function newRating(
  rating: number,
  k: number,
  expected: number,
  actual: Outcome | number,
): number {
  return rating + k * (actual - expected);
}

/**
 * Compute both new ratings after a head-to-head match.
 * Returns [newRatingA, newRatingB].
 */
export function rateMatch(
  ratingA: number,
  ratingB: number,
  outcome: Outcome,
  kA: number,
  kB: number = kA,
): [number, number] {
  const eA = expectedScore(ratingA, ratingB);
  const eB = 1 - eA;
  const outcomeB = (1 - outcome) as Outcome;
  return [
    newRating(ratingA, kA, eA, outcome),
    newRating(ratingB, kB, eB, outcomeB),
  ];
}
