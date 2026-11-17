import { prisma } from "@/lib/db";
import { errorResponse, json, requirePermission } from "@/lib/api/http";

export async function GET() {
  try {
    const principal = await requirePermission({ action: "READ", domain: "SETTINGS" });
    const items = await prisma.user.findMany({
      where: { entityId: principal.entityId },
      select: { id: true, nameHe: true, email: true, isDemo: true },
      orderBy: { nameHe: "asc" },
    });
    return json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}
