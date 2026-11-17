import { prisma } from "@/lib/db";
import { errorResponse, json, requirePermission } from "@/lib/api/http";

export async function GET() {
  try {
    const principal = await requirePermission({ action: "READ", domain: "INTEGRATION" });
    const items = await prisma.integrationConnection.findMany({
      where: { entityId: principal.entityId },
      include: { bankAccount: true, runs: { orderBy: { startedAt: "desc" }, take: 3 } },
      orderBy: { labelHe: "asc" },
    });
    return json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}
