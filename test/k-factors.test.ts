import { describe, it, expect } from "vitest";
import { constant, fide, uscf, linearDecay } from "../src/k-factors.js";
import type { Rating } from "../src/types.js";

function makePlayer(overrides: Partial<Rating> = {}): Rating {
  return {
    id: "test",
    rating: 1500,
    gamesPlayed: 50,
    wins: 25,
    losses: 20,
    draws: 5,
    ...overrides,
  };
}

describe("constant", () => {
  it("always returns the same value", () => {
    const fn = constant(24);
    expect(fn(makePlayer())).toBe(24);
    expect(fn(makePlayer({ rating: 2800, gamesPlayed: 1000 }))).toBe(24);
  });
});

describe("fide", () => {
  const fn = fide();

  it("returns 40 for new players (<30 games)", () => {
    expect(fn(makePlayer({ gamesPlayed: 0 }))).toBe(40);
    expect(fn(makePlayer({ gamesPlayed: 29 }))).toBe(40);
  });

  it("returns 10 for high-rated players (2400+)", () => {
    expect(fn(makePlayer({ rating: 2400 }))).toBe(10);
    expect(fn(makePlayer({ rating: 2800 }))).toBe(10);
  });

  it("returns 20 for experienced mid-rated players", () => {
    expect(fn(makePlayer({ rating: 1800, gamesPlayed: 30 }))).toBe(20);
    expect(fn(makePlayer({ rating: 2399, gamesPlayed: 100 }))).toBe(20);
  });
});

describe("uscf", () => {
  const fn = uscf();

  it("returns 32 below 2100", () => {
    expect(fn(makePlayer({ rating: 1500 }))).toBe(32);
  });

  it("returns 24 between 2100-2399", () => {
    expect(fn(makePlayer({ rating: 2100 }))).toBe(24);
    expect(fn(makePlayer({ rating: 2399 }))).toBe(24);
  });

  it("returns 16 at 2400+", () => {
    expect(fn(makePlayer({ rating: 2400 }))).toBe(16);
  });
});

describe("linearDecay", () => {
  const fn = linearDecay(40, 10, 30);

  it("starts at high", () => {
    expect(fn(makePlayer({ gamesPlayed: 0 }))).toBe(40);
  });

  it("ends at low", () => {
    expect(fn(makePlayer({ gamesPlayed: 30 }))).toBe(10);
    expect(fn(makePlayer({ gamesPlayed: 100 }))).toBe(10);
  });

  it("interpolates midway", () => {
    expect(fn(makePlayer({ gamesPlayed: 15 }))).toBeCloseTo(25);
  });
});
