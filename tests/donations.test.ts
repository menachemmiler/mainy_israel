import { describe, expect, it } from "vitest";
import { summarizeDonations } from "@/lib/donations/count-once";

describe("A03 split donation counted once", () => {
  it("counts one donation with two division allocations", () => {
    const summary = summarizeDonations([
      {
        donationId: "d1",
        total: 12000,
        allocations: [
          { divisionId: "building", amount: 5000 },
          { divisionId: "operating", amount: 7000 },
        ],
      },
    ]);
    expect(summary.organizationalCount).toBe(1);
    expect(summary.allocationCount).toBe(2);
    expect(summary.unbalanced).toHaveLength(0);
    expect(summary.byDivision.building).toBe("5000.00");
  });
});
