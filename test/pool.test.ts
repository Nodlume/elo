import { describe, it, expect } from "vitest";
import { RatingPool } from "../src/pool.js";
import { fide } from "../src/k-factors.js";

describe("RatingPool", () => {
  it("auto-registers players on recordMatch", () => {
    const pool = new RatingPool();
    pool.recordMatch("alice", "bob", 1);
    expect(pool.size).toBe(2);
    expect(pool.has("alice")).toBe(true);
    expect(pool.has("bob")).toBe(true);
  });

  it("uses custom initial rating", () => {
    const pool = new RatingPool({ initialRating: 1000 });
    const p = pool.getPlayer("x");
    expect(p.rating).toBe(1000);
  });

  it("updates ratings correctly on win", () => {
    const pool = new RatingPool({ kFactor: 32 });
    const result = pool.recordMatch("alice", "bob", 1);
    expect(result.playerA.delta).toBeGreaterThan(0);
    expect(result.playerB.delta).toBeLessThan(0);
    expect(result.playerA.delta).toBeCloseTo(-result.playerB.delta);
  });

  it("tracks wins/losses/draws", () => {
    const pool = new RatingPool();
    pool.recordMatch("a", "b", 1);
    pool.recordMatch("a", "b", 0);
    pool.recordMatch("a", "b", 0.5);

    const a = pool.getPlayer("a");
    expect(a.wins).toBe(1);
    expect(a.losses).toBe(1);
    expect(a.draws).toBe(1);
    expect(a.gamesPlayed).toBe(3);
  });

  it("leaderboard returns sorted by rating desc", () => {
    const pool = new RatingPool();
    pool.addPlayer("low", 1200);
    pool.addPlayer("mid", 1500);
    pool.addPlayer("high", 1800);
    const board = pool.leaderboard();
    expect(board[0].id).toBe("high");
    expect(board[2].id).toBe("low");
  });

  it("records match history", () => {
    const pool = new RatingPool();
    pool.recordMatch("a", "b", 1);
    pool.recordMatch("b", "c", 0.5);
    expect(pool.getHistory()).toHaveLength(2);
    expect(pool.getHistory("b")).toHaveLength(2);
    expect(pool.getHistory("c")).toHaveLength(1);
  });

  it("clamps ratings to min/max", () => {
    const pool = new RatingPool({ minRating: 100, maxRating: 2000, kFactor: 32 });
    pool.addPlayer("floor", 105);
    pool.addPlayer("ceil", 1995);
    // floor loses → should clamp at 100
    pool.recordMatch("floor", "ceil", 0);
    expect(pool.getPlayer("floor").rating).toBeGreaterThanOrEqual(100);
    expect(pool.getPlayer("ceil").rating).toBeLessThanOrEqual(2000);
  });

  it("accepts K-factor function", () => {
    const pool = new RatingPool({ kFactor: fide() });
    pool.recordMatch("new", "new2", 1);
    // new players get K=40, so delta should be ~20
    const p = pool.getPlayer("new");
    expect(p.rating).toBeCloseTo(1520);
  });

  it("addPlayer is idempotent", () => {
    const pool = new RatingPool();
    pool.addPlayer("x", 1600);
    pool.addPlayer("x", 1800); // should not overwrite
    expect(pool.getPlayer("x").rating).toBe(1600);
  });

  it("removePlayer works", () => {
    const pool = new RatingPool();
    pool.addPlayer("x");
    expect(pool.removePlayer("x")).toBe(true);
    expect(pool.has("x")).toBe(false);
    expect(pool.removePlayer("x")).toBe(false);
  });

  it("reset clears everything", () => {
    const pool = new RatingPool();
    pool.recordMatch("a", "b", 1);
    pool.reset();
    expect(pool.size).toBe(0);
    expect(pool.getHistory()).toHaveLength(0);
  });
});

describe("RatingPool.recordFreeForAll", () => {
  it("processes all pairs from multi-player result", () => {
    const pool = new RatingPool();
    const results = pool.recordFreeForAll([
      { id: "first", score: 10 },
      { id: "second", score: 7 },
      { id: "third", score: 3 },
    ]);
    // 3 players → 3 pairs
    expect(results).toHaveLength(3);
    // first place should have highest rating
    const board = pool.leaderboard();
    expect(board[0].id).toBe("first");
    expect(board[2].id).toBe("third");
  });

  it("handles ties", () => {
    const pool = new RatingPool();
    pool.recordFreeForAll([
      { id: "a", score: 5 },
      { id: "b", score: 5 },
    ]);
    // tied → draw → no rating change
    expect(pool.getPlayer("a").rating).toBeCloseTo(pool.getPlayer("b").rating);
    expect(pool.getPlayer("a").draws).toBe(1);
  });
});
