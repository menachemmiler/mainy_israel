import { errorResponse, json, requirePrincipal } from "@/lib/api/http";
import { ROLE_LABEL_HE } from "@/lib/rbac/policy";
import { navFor } from "@/lib/nav";

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const roles = Array.from(new Set(principal.grants.map((g) => g.role)));
    return json({
      user: {
        id: principal.userId,
        email: principal.email,
        nameHe: principal.nameHe,
        entityId: principal.entityId,
        roles: roles.map((code) => ({ code, labelHe: ROLE_LABEL_HE[code] })),
      },
      nav: navFor(principal),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
