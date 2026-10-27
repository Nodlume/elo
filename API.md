# @quokkaquery/elo — API Reference

Distilled API surface for agent prompts and quick reference.

## Types

```ts
type Outcome = 1 | 0.5 | 0;  // win / draw / loss from player A's perspective

type KFactorFn = (player: Rating) => number;

interface Rating {
  id: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

interface RatingDelta {
  id: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

interface UpdateResult {
  playerA: RatingDelta;
  playerB: RatingDelta;
}

interface Match {
  playerA: string;
  playerB: string;
  outcome: Outcome;
  timestamp?: number;
}

interface FreeForAllEntry {
  id: string;
  score: number;  // higher = better
}

interface PoolConfig {
  initialRating?: number;        // default: 1500
  kFactor?: number | KFactorFn;  // default: 32
  minRating?: number;            // default: -Infinity
  maxRating?: number;            // default: Infinity
}
```

## Core Functions

```ts
function expectedScore(ratingA: number, ratingB: number): number;
```
Returns expected score (0..1) of A vs B using the logistic curve with base 10 and divisor 400.

```ts
function newRating(rating: number, k: number, expected: number, actual: Outcome | number): number;
```
Computes `rating + k * (actual - expected)`. No clamping.

```ts
function rateMatch(ratingA: number, ratingB: number, outcome: Outcome, kA: number, kB?: number): [number, number];
```
Returns `[newRatingA, newRatingB]`. `kB` defaults to `kA`. No clamping.

## K-Factor Strategies (`kFactors.*`)

```ts
function constant(k: number): KFactorFn;
```
Always returns `k`.

```ts
function fide(): KFactorFn;
```
K=40 if `gamesPlayed < 30`, K=10 if `rating >= 2400`, K=20 otherwise.

```ts
function uscf(): KFactorFn;
```
K=32 if `rating < 2100`, K=24 if `rating < 2400`, K=16 otherwise.

```ts
function linearDecay(high: number, low: number, games: number): KFactorFn;
```
Linearly interpolates from `high` to `low` over the first `games` matches, then stays at `low`.

## RatingPool

```ts
class RatingPool {
  constructor(config?: PoolConfig);

  addPlayer(id: string, rating?: number): Rating;
  getPlayer(id: string): Rating;              // auto-registers if missing
  has(id: string): boolean;
  removePlayer(id: string): boolean;          // does NOT remove history
  get size(): number;

  recordMatch(playerA: string, playerB: string, outcome: Outcome): UpdateResult;
  recordFreeForAll(entries: FreeForAllEntry[]): UpdateResult[];  // all pairwise matches

  leaderboard(): Rating[];                    // sorted by rating desc
  getHistory(playerId?: string): Match[];     // all or filtered by player

  reset(): void;                              // clears players and history
}
```

### Behavior notes

- `addPlayer` is idempotent: second call returns existing Rating unchanged.
- `getPlayer` auto-registers at `initialRating` if player is missing.
- Rating clamping (`minRating`/`maxRating`) only applies inside `RatingPool`, not bare `newRating`/`rateMatch`.
- Numeric `kFactor` in config is wrapped with `kFactors.constant()`.
- `recordFreeForAll` derives pairwise outcomes from scores: higher score wins, equal scores draw.
- `removePlayer` deletes the rating but match history is preserved.
