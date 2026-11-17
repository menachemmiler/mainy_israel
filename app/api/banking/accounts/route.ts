import { prisma } from "@/lib/db";
import { errorResponse, json, requirePermission } from "@/lib/api/http";

export async function GET() {
  try {
    const principal = await requirePermission({ action: "READ", domain: "BANK" });
    const accounts = await prisma.bankAccount.findMany({
      where: { entityId: principal.entityId },
      include: { connection: true },
      orderBy: { labelHe: "asc" },
    });
    return json({ items: accounts });
  } catch (error) {
    return errorResponse(error);
  }
}
