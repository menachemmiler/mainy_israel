import type { ActionCode, DomainCode } from "@prisma/client";
import { ROLE_POLICY } from "./policy";
import type {
  AccessCheck,
  AccessDecision,
  AuthPrincipal,
  EffectiveGrant,
  PermissionScope,
} from "./types";

function scopeMatches(grant: PermissionScope, record?: AccessCheck["record"]): boolean {
  if (grant.type === "ENTITY") return true;
  // Collection endpoints omit a record; any in-scope grant may enter, then the query filters rows.
  if (!record) return true;
  if (grant.type === "DIVISION") {
    if (!grant.divisionId) return false;
    return record.divisionId === grant.divisionId;
  }
  if (grant.type === "PROJECT") {
    if (!grant.projectId) return false;
    return record.projectId === grant.projectId;
  }
  if (grant.type === "BRANCH" || grant.type === "CAMPAIGN") {
    return grant.id != null && grant.id === record.id;
  }
  return false;
}

function restrictionApplies(
  principal: AuthPrincipal,
  domain: DomainCode,
  field: string | undefined,
  record?: AccessCheck["record"],
) {
  if (!field) return undefined;
  return principal.restrictions.find((r) => {
    if (r.domain !== domain || r.field !== field) return false;
    return scopeMatches(r.scope, record);
  });
}

export function grantsFromRole(
  role: EffectiveGrant["role"],
  scope: PermissionScope,
  source: EffectiveGrant["source"] = "role",
  endsAt?: Date | null,
): EffectiveGrant[] {
  const policy = ROLE_POLICY[role];
  const grants: EffectiveGrant[] = [];
  for (const [domain, actions] of Object.entries(policy.domains)) {
    for (const action of actions ?? []) {
      grants.push({
        role,
        action,
        domain: domain as DomainCode,
        scope,
        source,
        endsAt,
      });
    }
  }
  return grants;
}

export function decide(principal: AuthPrincipal, check: AccessCheck): AccessDecision {
  if (!principal.isActive) {
    return { allowed: false, reason: "המשתמש אינו פעיל" };
  }

  const restriction = restrictionApplies(principal, check.domain, check.field, check.record);
  if (restriction) {
    return {
      allowed: false,
      reason: `הגבלת מידע מפורשת על השדה ${check.field} גוברת`,
      restriction,
    };
  }

  const now = new Date();
  const candidates = principal.grants.filter((g) => {
    if (g.action !== check.action || g.domain !== check.domain) return false;
    if (g.endsAt && g.endsAt <= now) return false;
    return scopeMatches(g.scope, check.record);
  });

  if (candidates.length === 0) {
    return {
      allowed: false,
      reason: `אין הרשאת ${check.action} בתחום ${check.domain} בהיקף הרשומה`,
    };
  }

  return {
    allowed: true,
    reason: `הורשה לפי תפקיד ${candidates[0].role} (${candidates[0].source})`,
    matchedGrant: candidates[0],
  };
}

export function assertAllowed(principal: AuthPrincipal, check: AccessCheck): AccessDecision {
  const decision = decide(principal, check);
  if (!decision.allowed) {
    const error = new Error(decision.reason) as Error & { status: number; decision: AccessDecision };
    error.status = 403;
    error.decision = decision;
    throw error;
  }
  return decision;
}

export function can(principal: AuthPrincipal, action: ActionCode, domain: DomainCode, record?: AccessCheck["record"], field?: string) {
  return decide(principal, { action, domain, record, field }).allowed;
}

export function visibleDivisionIds(principal: AuthPrincipal, domain: DomainCode, action: ActionCode = "READ"): string[] | "entity" {
  const now = new Date();
  const grants = principal.grants.filter(
    (g) => g.action === action && g.domain === domain && (!g.endsAt || g.endsAt > now),
  );
  if (grants.some((g) => g.scope.type === "ENTITY")) return "entity";
  return Array.from(
    new Set(grants.map((g) => g.scope.divisionId).filter((id): id is string => Boolean(id))),
  );
}

export function taskListFilter(principal: AuthPrincipal): { assigneeId?: string; divisionIds?: string[] | "entity" } {
  const taskRoles = new Set(principal.grants.filter((g) => g.domain === "TASK").map((g) => g.role));
  const collectorOnly = taskRoles.size > 0 && [...taskRoles].every((role) => role === "COLLECTOR");
  if (collectorOnly) return { assigneeId: principal.userId };
  return { divisionIds: visibleDivisionIds(principal, "TASK") };
}

export function maskNationalId(value: string | null | undefined, allowed: boolean): string | null {
  if (!value) return null;
  if (allowed) return value;
  if (value.length <= 4) return "****";
  return `*****${value.slice(-4)}`;
}

export function explainAccess(principal: AuthPrincipal, check: AccessCheck): AccessDecision {
  return decide(principal, check);
}
