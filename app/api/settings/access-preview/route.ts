import { prisma } from "@/lib/db";
import { decide } from "@/lib/rbac/engine";
import { ACTION_LABEL_HE, DOMAIN_LABEL_HE, ROLE_LABEL_HE } from "@/lib/rbac/policy";
import { ApiError, errorResponse, json, requirePermission } from "@/lib/api/http";
import { loadPrincipal } from "@/lib/auth/principal";
import type { ActionCode, DomainCode } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requirePermission({ action: "READ", domain: "SETTINGS" });
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) throw new ApiError(400, "חסר userId");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "משתמש לא נמצא");
    const principal = await loadPrincipal({ sub: user.id, entityId: user.entityId, email: user.email });
    if (!principal) throw new ApiError(400, "לא ניתן לטעון הרשאות");

    const domains: DomainCode[] = [
      "CONTACT",
      "DONOR",
      "TASK",
      "BUDGET",
      "BANK",
      "PAYROLL",
      "CHARITY_CASE",
      "REPORT",
    ];
    const actions: ActionCode[] = ["READ", "CREATE", "UPDATE", "APPROVE", "EXPORT", "TRANSMIT_BANK"];

    const matrix = domains.map((domain) => ({
      domain,
      domainHe: DOMAIN_LABEL_HE[domain],
      actions: actions.map((action) => {
        const decision = decide(principal, { action, domain });
        return {
          action,
          actionHe: ACTION_LABEL_HE[action],
          allowed: decision.allowed,
          reason: decision.reason,
        };
      }),
    }));

    const roles = Array.from(new Set(principal.grants.map((g) => g.role)));
    return json({
      user: { id: user.id, nameHe: user.nameHe, email: user.email },
      roles: roles.map((code) => ({ code, labelHe: ROLE_LABEL_HE[code] })),
      restrictions: principal.restrictions,
      matrix,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
