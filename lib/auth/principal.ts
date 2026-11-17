import { prisma } from "@/lib/db";
import { grantsFromRole } from "@/lib/rbac/engine";
import type { AuthPrincipal, EffectiveGrant, FieldRestrictionView } from "@/lib/rbac/types";
import type { SessionPayload } from "./session";

export async function loadPrincipal(session: SessionPayload): Promise<AuthPrincipal | null> {
  const user = await prisma.user.findFirst({
    where: { id: session.sub, entityId: session.entityId, isActive: true },
    include: { roleAssignments: true, temporaryGrants: true, fieldRestrictions: true },
  });
  if (!user) return null;

  const grants: EffectiveGrant[] = [];
  for (const assignment of user.roleAssignments) {
    grants.push(
      ...grantsFromRole(assignment.role, {
        type: assignment.scopeType,
        id: assignment.scopeId,
        divisionId: assignment.divisionId,
        projectId: assignment.projectId,
      }),
    );
  }

  const now = new Date();
  for (const grant of user.temporaryGrants) {
    if (grant.endsAt <= now || grant.startsAt > now) continue;
    grants.push(
      ...grantsFromRole(
        grant.role,
        {
          type: grant.scopeType,
          id: grant.scopeId,
          divisionId: grant.divisionId,
        },
        "temporary",
        grant.endsAt,
      ),
    );
  }

  const restrictions: FieldRestrictionView[] = user.fieldRestrictions.map((r) => ({
    domain: r.domain,
    field: r.field,
    scope: { type: r.scopeType, id: r.scopeId, divisionId: r.divisionId },
  }));

  return {
    userId: user.id,
    entityId: user.entityId,
    email: user.email,
    nameHe: user.nameHe,
    isActive: user.isActive,
    grants,
    restrictions,
  };
}

export async function loadPrincipalOrNull(session: SessionPayload | null) {
  if (!session) return null;
  return loadPrincipal(session);
}
