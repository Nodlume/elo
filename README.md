# @quokkaquery/elo

> Built and maintained by [QuokkaQuery](https://quokkaquery.com). Source on [GitHub](https://github.com/Nodlume/elo).

Reusable ELO rating system — core math, pluggable K-factor strategies, managed rating pools with match history and free-for-all support.

## Install

```bash
npm install @quokkaquery/elo
```

## Quick Start

```ts
import { RatingPool, kFactors } from "@quokkaquery/elo";

const pool = new RatingPool({ kFactor: kFactors.fide() });

pool.recordMatch("alice", "bob", 1);   // alice wins
pool.recordMatch("bob", "carol", 0.5); // draw
pool.recordMatch("carol", "alice", 0); // alice wins

pool.leaderboard();
// [{ id: "alice", rating: 1531.4, ... }, ...]
```

## API

### Core Functions (stateless)

```ts
import { expectedScore, newRating, rateMatch } from "@quokkaquery/elo";

// Probability that A beats B (0–1)
expectedScore(1600, 1400); // ~0.76

// Updated rating after a single game
newRating(1500, 32, 0.5, 1); // 1516

// Both new ratings from a head-to-head match
// Returns [newRatingA, newRatingB]
rateMatch(1500, 1500, 1, 32);       // equal K
rateMatch(1500, 1500, 1, 40, 20);   // asymmetric K
```

### K-Factor Strategies

```ts
import { kFactors } from "@quokkaquery/elo";

kFactors.constant(24);              // always 24
kFactors.fide();                    // 40/20/10 based on games + rating
kFactors.uscf();                    // 32/24/16 by rating bracket
kFactors.linearDecay(40, 10, 30);   // 40→10 over first 30 games
```

### RatingPool

```ts
import { RatingPool } from "@quokkaquery/elo";

const pool = new RatingPool({
  initialRating: 1500,       // default: 1500
  kFactor: 32,               // number or KFactorFn
  minRating: 100,            // floor (optional)
  maxRating: 3000,           // ceiling (optional)
});

// Players
pool.addPlayer("alice", 1600);  // optional starting rating
pool.getPlayer("alice");        // { id, rating, gamesPlayed, wins, losses, draws }
pool.has("alice");
pool.removePlayer("alice");

// Matches
const result = pool.recordMatch("alice", "bob", 1);  // 1=A wins, 0=B wins, 0.5=draw
// result.playerA = { id, oldRating, newRating, delta }
// result.playerB = { id, oldRating, newRating, delta }

// Free-for-all (round-robin pairwise from scores)
pool.recordFreeForAll([
  { id: "alice", score: 10 },
  { id: "bob", score: 7 },
  { id: "carol", score: 3 },
]);

// Queries
pool.leaderboard();           // sorted by rating desc
pool.getHistory();            // all matches
pool.getHistory("alice");     // alice's matches
pool.size;                    // player count
pool.reset();                 // clear everything
```

## Types

| Type | Description |
|------|-------------|
| `Outcome` | `1 \| 0.5 \| 0` — result from player A's perspective |
| `Rating` | Player snapshot: `{ id, rating, gamesPlayed, wins, losses, draws }` |
| `UpdateResult` | `{ playerA: RatingDelta, playerB: RatingDelta }` |
| `RatingDelta` | `{ id, oldRating, newRating, delta }` |
| `KFactorFn` | `(player: Rating) => number` |
| `PoolConfig` | `{ initialRating?, kFactor?, minRating?, maxRating? }` |
| `FreeForAllEntry` | `{ id: string, score: number }` |

## Tests

```bash
npm test       # 38 tests
```

## Gotchas

- **Outcome is always from player A's perspective**: `1` = A wins, `0` = A loses, `0.5` = draw.
- **`addPlayer` is idempotent**: calling it twice returns the existing Rating unchanged (does not reset).
- **`getPlayer` auto-registers**: accessing a missing player creates them at `initialRating`.
- **`removePlayer` does not remove history**: match records remain in `getHistory()`.
- **`kFactor` in PoolConfig accepts both a number and a function**: a number is wrapped with `kFactors.constant()`.
- **`rateMatch` (core)** takes raw K-factors; **`pool.recordMatch`** derives K from the strategy function.
- **Rating clamping** only applies inside `RatingPool`, not in bare `newRating`/`rateMatch` calls.

## Common Patterns

### Pairwise comparison without a pool

```ts
import { expectedScore, rateMatch } from "@quokkaquery/elo";

const prob = expectedScore(1600, 1400); // ~0.76
const [newA, newB] = rateMatch(1600, 1400, 1, 32); // A wins, K=32
```

### Free-for-all tournament

```ts
const pool = new RatingPool();
const results = pool.recordFreeForAll([
  { id: "alice", score: 10 },
  { id: "bob", score: 7 },
  { id: "carol", score: 7 },
]);
// alice beats bob & carol (wins); bob vs carol is a draw
```

### Dynamic K-factor with rating floor

```ts
const pool = new RatingPool({
  kFactor: kFactors.linearDecay(40, 16, 50),
  minRating: 100,
});
```

## License

MIT © [QuokkaQuery](https://quokkaquery.com)

---

Part of the open-source tooling behind [QuokkaQuery](https://quokkaquery.com).
