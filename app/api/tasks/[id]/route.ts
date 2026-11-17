import { prisma } from "@/lib/db";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "TASK" });
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, entityId: principal.entityId },
      include: { contact: true, assignee: true, events: { orderBy: { createdAt: "desc" } }, division: true },
    });
    if (!task) throw new ApiError(404, "משימה לא נמצאה");
    if (principal.grants.every((g) => g.role === "COLLECTOR") && task.assigneeId !== principal.userId) {
      throw new ApiError(403, "אין גישה למשימה שלא הוקצתה לך");
    }
    return json({ item: task });
  } catch (error) {
    return errorResponse(error);
  }
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "WAITING", "DONE", "CANCELLED"]).optional(),
  result: z.string().optional(),
  note: z.string().optional(),
  reminderAt: z.string().optional(),
  assigneeId: z.string().optional(),
  version: z.number(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const principal = await requirePermission({ action: "UPDATE", domain: "TASK" });
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const existing = await prisma.task.findFirst({ where: { id, entityId: principal.entityId } });
    if (!existing) throw new ApiError(404, "משימה לא נמצאה");
    if (existing.version !== body.version) {
      throw new ApiError(409, "התנגשות עריכה. נשמרה גרסה אחרת. רענן והכרע.");
    }
    const task = await prisma.task.update({
      where: { id },
      data: {
        status: body.status,
        result: body.result,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : undefined,
        assigneeId: body.assigneeId,
        version: { increment: 1 },
        events: {
          create: {
            actorId: principal.userId,
            kind: body.status === "DONE" ? "closed" : "updated",
            note: body.note ?? body.result,
          },
        },
      },
    });
    await writeAudit({
      principal,
      action: body.status === "DONE" ? "close" : "update",
      domain: "TASK",
      recordType: "Task",
      recordId: task.id,
    });
    return json({ item: task });
  } catch (error) {
    return errorResponse(error);
  }
}
