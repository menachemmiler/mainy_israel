import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac/engine";
import { errorResponse, json, requirePrincipal } from "@/lib/api/http";

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const entityId = principal.entityId;

    const [accounts, openTasks, overdueTasks, drafts, staleDonors] = await Promise.all([
      can(principal, "READ", "BANK")
        ? prisma.bankAccount.findMany({ where: { entityId, status: "ACTIVE" } })
        : Promise.resolve([]),
      prisma.task.count({
        where: {
          entityId,
          status: { in: ["OPEN", "WAITING"] },
          ...(principal.grants.some((g) => g.role === "COLLECTOR") && !can(principal, "APPROVE", "TASK")
            ? { assigneeId: principal.userId }
            : {}),
        },
      }),
      prisma.task.count({
        where: {
          entityId,
          status: { in: ["OPEN", "WAITING"] },
          dueAt: { lt: new Date() },
        },
      }),
      can(principal, "READ", "BANK")
        ? prisma.transferDraft.findMany({
            where: { bankAccount: { entityId }, status: { in: ["MOCK_PREPARED", "AWAITING_SIGNATURES", "AWAITING_BANK_VERIFY"] } },
            take: 8,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      can(principal, "READ", "DONOR")
        ? prisma.commitment.count({ where: { entityId, status: { in: ["PENDING", "FAILED"] } } })
        : Promise.resolve(0),
    ]);

    const lastSync = accounts.reduce<Date | null>((latest, a) => {
      if (!a.lastSyncedAt) return latest;
      if (!latest || a.lastSyncedAt > latest) return a.lastSyncedAt;
      return latest;
    }, null);

    return json({
      bankSyncedAt: lastSync,
      balances: accounts.map((a) => ({
        id: a.id,
        labelHe: a.labelHe,
        currency: a.currency,
        currentBalance: a.currentBalance,
        balanceAsOf: a.balanceAsOf,
      })),
      openTasks,
      overdueTasks,
      drafts,
      pendingCollections: staleDonors,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
