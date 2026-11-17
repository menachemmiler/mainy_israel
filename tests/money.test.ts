import { describe, expect, it } from "vitest";
import { splitInstallments, allocationsBalance } from "@/lib/money";
import { applyRule29 } from "@/lib/dates";

describe("P02 installments", () => {
  it("splits 1000 into 333.33, 333.33, 333.34", () => {
    const parts = splitInstallments(1000, 3).map((p) => p.toFixed(2));
    expect(parts).toEqual(["333.33", "333.33", "333.34"]);
    expect(allocationsBalance(1000, parts).ok).toBe(true);
  });
});

describe("Rule of 29", () => {
  it("is off by default", () => {
    const d = new Date("2026-03-29T10:00:00+02:00");
    expect(applyRule29(d, false).getDate()).toBe(d.getDate());
  });

  it("moves first payment when enabled", () => {
    const d = new Date("2026-03-29T10:00:00+02:00");
    const moved = applyRule29(d, true);
    expect(moved.getMonth()).toBeGreaterThan(d.getMonth() - (d.getMonth() === 11 ? 12 : 0));
    expect(moved.getDate()).toBe(1);
  });
});
