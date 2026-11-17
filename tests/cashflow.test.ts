import { describe, expect, it } from "vitest";
import cashflowFile from "@/data/cashflow.json";
import {
  buildForecast,
  CERTAINTY_ORDER,
  type ScenarioDef,
} from "@/lib/cashflow/forecast";

const file = cashflowFile as {
  horizonDays: number;
  restricted: { amount: string }[];
  scenarios: ScenarioDef[];
  items: Parameters<typeof buildForecast>[0]["items"];
};

const restricted = file.restricted.reduce((s, r) => s + Number(r.amount), 0);

function run(scenarioId: string, certainty = [...CERTAINTY_ORDER]) {
  const scenario = file.scenarios.find((s) => s.id === scenarioId)!;
  return buildForecast({
    openingBalance: "184320.50",
    cutoff: "2026-11-17",
    horizonDays: file.horizonDays,
    items: file.items,
    scenario,
    enabledCertainty: certainty,
    restricted,
    currency: "ILS",
  });
}

describe("cashflow forecast", () => {
  it("starts from the cutoff balance and does not mix USD", () => {
    const result = run("base");
    expect(result.series[0]?.opening).toBe("184320.50");
    expect(result.included.some((i) => i.currency === "USD")).toBe(false);
    expect(result.included.some((i) => i.id === "usd-wire")).toBe(false);
  });

  it("keeps undated items off the daily series", () => {
    const result = run("base");
    expect(result.undated.map((i) => i.id)).toContain("undated-refund");
    expect(result.series.some((d) => d.items.some((i) => i.id === "undated-refund"))).toBe(false);
  });

  it("base scenario stays non-negative while delaying 70k creates a trough and deficit days", () => {
    const base = run("base");
    const delayed = run("delay-grant");
    expect(base.daysInDeficit).toBe(0);
    expect(Number(base.trough.balance)).toBeGreaterThan(0);
    expect(delayed.daysInDeficit).toBeGreaterThan(0);
    expect(Number(delayed.trough.balance)).toBeLessThan(0);
    const grant = delayed.included.find((i) => i.id === "grant-70k");
    expect(grant?.date).toBe("2026-11-29");
    expect(grant?.shifted).toBe(true);
  });

  it("conservative scenario drops medium-certainty receipts", () => {
    const conservative = run("conservative");
    expect(conservative.included.some((i) => i.id === "levy-collection")).toBe(false);
    expect(conservative.included.some((i) => i.id === "grant-70k")).toBe(true);
  });
});
