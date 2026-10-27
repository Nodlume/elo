import { expectedScore, newRating } from "./core.js";
import { constant } from "./k-factors.js";
import type {
  FreeForAllEntry,
  KFactorFn,
  Match,
  Outcome,
  PoolConfig,
  Rating,
  RatingDelta,
  UpdateResult,
} from "./types.js";

/**
 * A managed rating pool that tracks players, processes matches,
 * and maintains history.
 */
export class RatingPool {
  private players = new Map<string, Rating>();
  private history: Match[] = [];
  private initialRating: number;
  private kFactorFn: KFactorFn;
  private minRating: number;
  private maxRating: number;

  constructor(config: PoolConfig = {}) {
    this.initialRating = config.initialRating ?? 1500;
    this.kFactorFn =
      typeof config.kFactor === "function"
        ? config.kFactor
        : constant(config.kFactor ?? 32);
    this.minRating = config.minRating ?? -Infinity;
    this.maxRating = config.maxRating ?? Infinity;
  }

  /** Register a player with an optional starting rating. */
  addPlayer(id: string, rating?: number): Rating {
    if (this.players.has(id)) return this.players.get(id)!;
    const r: Rating = {
      id,
      rating: rating ?? this.initialRating,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };
    this.players.set(id, r);
    return r;
  }

  /** Get a player's current rating, auto-registering if needed. */
  getPlayer(id: string): Rating {
    if (!this.players.has(id)) this.addPlayer(id);
    return this.players.get(id)!;
  }

  /** Get all players sorted by rating descending. */
  leaderboard(): Rating[] {
    return [...this.players.values()].sort((a, b) => b.rating - a.rating);
  }

  /** Get match history, optionally filtered by player. */
  getHistory(playerId?: string): Match[] {
    if (!playerId) return [...this.history];
    return this.history.filter(
      (m) => m.playerA === playerId || m.playerB === playerId,
    );
  }

  /** Record a match and update both players' ratings. */
  recordMatch(playerA: string, playerB: string, outcome: Outcome): UpdateResult {
    const a = this.getPlayer(playerA);
    const b = this.getPlayer(playerB);

    const kA = this.kFactorFn(a);
    const kB = this.kFactorFn(b);

    const eA = expectedScore(a.rating, b.rating);
    const eB = 1 - eA;
    const outcomeB = (1 - outcome) as Outcome;

    const oldA = a.rating;
    const oldB = b.rating;

    a.rating = this.clamp(newRating(a.rating, kA, eA, outcome));
    b.rating = this.clamp(newRating(b.rating, kB, eB, outcomeB));

    a.gamesPlayed++;
    b.gamesPlayed++;

    if (outcome === 1) {
      a.wins++;
      b.losses++;
    } else if (outcome === 0) {
      a.losses++;
      b.wins++;
    } else {
      a.draws++;
      b.draws++;
    }

    this.history.push({
      playerA,
      playerB,
      outcome,
      timestamp: Date.now(),
    });

    return {
      playerA: { id: playerA, oldRating: oldA, newRating: a.rating, delta: a.rating - oldA },
      playerB: { id: playerB, oldRating: oldB, newRating: b.rating, delta: b.rating - oldB },
    };
  }

  /**
   * Process a free-for-all / multi-player result.
   * Each pair is matched: higher-scored player gets a win, equal scores draw.
   * Returns all pairwise deltas.
   */
  recordFreeForAll(entries: FreeForAllEntry[]): UpdateResult[] {
    const results: UpdateResult[] = [];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        let outcome: Outcome;
        if (a.score > b.score) outcome = 1;
        else if (a.score < b.score) outcome = 0;
        else outcome = 0.5;
        results.push(this.recordMatch(a.id, b.id, outcome));
      }
    }
    return results;
  }

  /** Number of registered players. */
  get size(): number {
    return this.players.size;
  }

  /** Check if a player exists. */
  has(id: string): boolean {
    return this.players.has(id);
  }

  /** Remove a player and their history. */
  removePlayer(id: string): boolean {
    return this.players.delete(id);
  }

  /** Reset all ratings to initial, clear history. */
  reset(): void {
    this.players.clear();
    this.history = [];
  }

  private clamp(rating: number): number {
    return Math.max(this.minRating, Math.min(this.maxRating, rating));
  }
}
