import { describe, expect, it } from "vitest";
import { decide, grantsFromRole, maskNationalId } from "@/lib/rbac/engine";
import type { AuthPrincipal } from "@/lib/rbac/types";

function principal(overrides: Partial<AuthPrincipal> = {}): AuthPrincipal {
  return {
    userId: "dana",
    entityId: "org",
    email: "dana@mayanei.local",
    nameHe: "דנה",
    isActive: true,
    grants: [
      ...grantsFromRole("DIVISION_MANAGER", { type: "DIVISION", divisionId: "building" }),
      ...grantsFromRole("DIVISION_MANAGER", { type: "DIVISION", divisionId: "operating" }),
      ...grantsFromRole("COLLECTOR", { type: "DIVISION", divisionId: "community" }),
    ],
    restrictions: [{ domain: "CONTACT", field: "nationalId", scope: { type: "ENTITY" } }],
    ...overrides,
  };
}

describe("A01 RBAC", () => {
  const dana = principal();

  it("allows division-manager read on assigned divisions only", () => {
    expect(decide(dana, { action: "READ", domain: "DONOR" }).allowed).toBe(true);
    expect(decide(dana, { action: "READ", domain: "DONOR", record: { divisionId: "building" } }).allowed).toBe(true);
    expect(decide(dana, { action: "READ", domain: "DONOR", record: { divisionId: "operating" } }).allowed).toBe(true);
    expect(decide(dana, { action: "APPROVE", domain: "DONOR", record: { divisionId: "community" } }).allowed).toBe(false);
  });

  it("collector role on third division can read assigned donor tasks but not export", () => {
    expect(decide(dana, { action: "READ", domain: "TASK", record: { divisionId: "community" } }).allowed).toBe(true);
    expect(decide(dana, { action: "EXPORT", domain: "REPORT" }).allowed).toBe(false);
  });

  it("explicit nationalId restriction wins", () => {
    const d = decide(dana, { action: "READ", domain: "CONTACT", field: "nationalId" });
    expect(d.allowed).toBe(false);
    expect(maskNationalId("123456782", false)).toBe("*****6782");
  });
});

describe("A02 expired temporary grant", () => {
  it("does not deliver after expiry", () => {
    const p = principal({
      grants: grantsFromRole("AUDITOR", { type: "ENTITY" }, "temporary", new Date("2020-01-01")),
    });
    expect(decide(p, { action: "EXPORT", domain: "REPORT" }).allowed).toBe(false);
  });
});

describe("payroll isolation", () => {
  it("treasurer cannot read payroll without dedicated grant", () => {
    const treasurer: AuthPrincipal = {
      ...principal(),
      grants: grantsFromRole("TREASURER", { type: "ENTITY" }),
      restrictions: [],
    };
    expect(decide(treasurer, { action: "READ", domain: "PAYROLL" }).allowed).toBe(false);
  });
});
