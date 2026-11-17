import { prisma } from "@/lib/db";
import { can, maskNationalId } from "@/lib/rbac/engine";
import { ApiError, errorResponse, json, requirePermission } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "CONTACT" });
    const { id } = await params;
    const contact = await prisma.contact.findFirst({
      where: { id, entityId: principal.entityId },
      include: {
        roles: true,
        channels: true,
        addresses: true,
        commitments: { include: { allocations: { include: { division: true } } } },
        donations: { include: { allocations: { include: { division: true } } } },
        assignedTasks: { where: { status: { in: ["OPEN", "WAITING"] } }, take: 10 },
      },
    });
    if (!contact) throw new ApiError(404, "כרטיס לא נמצא");

    const allowId = can(principal, "READ", "CONTACT", undefined, "nationalId");
    const donorRead = can(principal, "READ", "DONOR");
    const divisionIds = principal.grants
      .filter((g) => g.domain === "DONOR" && g.scope.divisionId)
      .map((g) => g.scope.divisionId as string);
    const entityDonor = principal.grants.some((g) => g.domain === "DONOR" && g.scope.type === "ENTITY");

    const filterAlloc = <T extends { divisionId: string }>(rows: T[]) => {
      if (!donorRead) return [];
      if (entityDonor) return rows;
      return rows.filter((r) => divisionIds.includes(r.divisionId));
    };

    return json({
      item: {
        ...contact,
        nationalId: maskNationalId(contact.nationalId, allowId),
        commitments: donorRead ? contact.commitments : [],
        donations: (donorRead ? contact.donations : []).map((d) => ({
          ...d,
          allocations: filterAlloc(d.allocations),
        })),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
