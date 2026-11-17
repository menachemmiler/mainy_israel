import { prisma } from "@/lib/db";
import { errorResponse, json, requirePermission } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "BANK" });
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const items = await prisma.bankMovement.findMany({
      where: {
        bankAccount: { entityId: principal.entityId },
        ...(accountId ? { bankAccountId: accountId } : {}),
      },
      include: { bankAccount: true },
      orderBy: { valueDate: "desc" },
      take: 200,
    });
    return json({ items, staleAfterHours: 24 });
  } catch (error) {
    return errorResponse(error);
  }
}
