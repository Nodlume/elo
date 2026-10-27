import { describe, it, expect } from "vitest";
import { expectedScore, newRating, rateMatch } from "../src/core.js";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it("returns ~0.76 for 200-point advantage", () => {
    expect(expectedScore(1700, 1500)).toBeCloseTo(0.7597, 3);
  });

  it("returns ~0.24 for 200-point disadvantage", () => {
    expect(expectedScore(1500, 1700)).toBeCloseTo(0.2403, 3);
  });

  it("expected scores of A vs B and B vs A sum to 1", () => {
    const eA = expectedScore(1600, 1400);
    const eB = expectedScore(1400, 1600);
    expect(eA + eB).toBeCloseTo(1);
  });

  it("returns near 1 for huge advantage", () => {
    expect(expectedScore(2800, 1000)).toBeGreaterThan(0.99);
  });

  it("returns near 0 for huge disadvantage", () => {
    expect(expectedScore(1000, 2800)).toBeLessThan(0.01);
  });
});

describe("newRating", () => {
  it("increases on win", () => {
    const r = newRating(1500, 32, 0.5, 1);
    expect(r).toBeGreaterThan(1500);
  });

  it("decreases on loss", () => {
    const r = newRating(1500, 32, 0.5, 0);
    expect(r).toBeLessThan(1500);
  });

  it("unchanged on draw with equal expected", () => {
    const r = newRating(1500, 32, 0.5, 0.5);
    expect(r).toBeCloseTo(1500);
  });

  it("gain equals k/2 for win as equal-rated", () => {
    // expected = 0.5, actual = 1 → delta = k*(1-0.5) = 16
    const r = newRating(1500, 32, 0.5, 1);
    expect(r).toBeCloseTo(1516);
  });
});

describe("rateMatch", () => {
  it("returns symmetric updates for equal players", () => {
    const [a, b] = rateMatch(1500, 1500, 1, 32);
    expect(a - 1500).toBeCloseTo(1500 - b);
  });

  it("draw between equals produces no change", () => {
    const [a, b] = rateMatch(1500, 1500, 0.5, 32);
    expect(a).toBeCloseTo(1500);
    expect(b).toBeCloseTo(1500);
  });

  it("underdog gains more on upset", () => {
    // 1300 beats 1700
    const [winner, loser] = rateMatch(1300, 1700, 1, 32);
    const winnerGain = winner - 1300;
    // winner gain should be large (close to 32)
    expect(winnerGain).toBeGreaterThan(24);
  });

  it("supports asymmetric K-factors", () => {
    const [a, b] = rateMatch(1500, 1500, 1, 40, 20);
    // A gains 40*0.5=20, B loses 20*0.5=10
    expect(a).toBeCloseTo(1520);
    expect(b).toBeCloseTo(1490);
  });

  it("total rating change is zero with equal K", () => {
    const [a, b] = rateMatch(1600, 1400, 1, 32);
    const deltaA = a - 1600;
    const deltaB = b - 1400;
    expect(deltaA + deltaB).toBeCloseTo(0);
  });
});
