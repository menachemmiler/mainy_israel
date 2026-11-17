import { prisma } from "@/lib/db";
import { taskListFilter } from "@/lib/rbac/engine";
import { errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "TASK" });
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "open";
    const mine = searchParams.get("mine") === "1";
    const type = searchParams.get("type");

    const where: Prisma.TaskWhereInput = { entityId: principal.entityId };
    if (tab === "open") where.status = { in: ["OPEN", "WAITING"] };
    if (tab === "done") where.status = "DONE";
    if (type) where.type = type as Prisma.TaskWhereInput["type"];

    const listFilter = taskListFilter(principal);
    if (mine || listFilter.assigneeId) where.assigneeId = principal.userId;
    else if (listFilter.divisionIds && listFilter.divisionIds !== "entity") {
      where.OR = [{ divisionId: { in: listFilter.divisionIds } }, { divisionId: null }];
    }

    const items = await prisma.task.findMany({
      where,
      include: { contact: true, assignee: true, division: true },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { priority: "desc" }],
      take: 200,
    });
    return json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  type: z.enum([
    "COLLECTION_REFUSAL",
    "STANDING_ORDER_REFUSAL",
    "STANDING_ORDER_RENEWAL",
    "MASAV_RETURN",
    "WAITING_BANK",
    "LEAD",
    "GENERAL",
    "ROUTING",
    "EXCEPTION",
    "COMPLETION",
    "APPROVAL",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  contactId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
  amount: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "CREATE", domain: "TASK" });
    const body = createSchema.parse(await request.json());
    const task = await prisma.task.create({
      data: {
        entityId: principal.entityId,
        type: body.type,
        title: body.title,
        description: body.description,
        contactId: body.contactId,
        assigneeId: body.assigneeId ?? principal.userId,
        createdById: principal.userId,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        amount: body.amount,
        events: { create: { actorId: principal.userId, kind: "created", note: "משימה נוצרה" } },
      },
    });
    await writeAudit({
      principal,
      action: "create",
      domain: "TASK",
      recordType: "Task",
      recordId: task.id,
    });
    return json({ item: task }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
