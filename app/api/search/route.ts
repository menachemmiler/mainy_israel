import { prisma } from "@/lib/db";
import { can, maskNationalId } from "@/lib/rbac/engine";
import { errorResponse, json, requirePrincipal } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const principal = await requirePrincipal();
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return json({ results: [] });

    const results: Array<{ type: string; id: string; title: string; subtitle?: string; href: string }> = [];

    if (can(principal, "READ", "CONTACT") || can(principal, "READ", "DONOR")) {
      const contacts = await prisma.contact.findMany({
        where: {
          entityId: principal.entityId,
          mergedIntoId: null,
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { nationalId: { contains: q } },
            { channels: { some: { value: { contains: q } } } },
          ],
        },
        take: 8,
      });
      const allowId = can(principal, "READ", "CONTACT", undefined, "nationalId");
      for (const c of contacts) {
        results.push({
          type: "contact",
          id: c.id,
          title: c.displayName,
          subtitle: [c.city, maskNationalId(c.nationalId, allowId)].filter(Boolean).join(" · "),
          href: `/contacts/${c.id}`,
        });
      }
    }

    if (can(principal, "READ", "TASK")) {
      const tasks = await prisma.task.findMany({
        where: {
          entityId: principal.entityId,
          title: { contains: q, mode: "insensitive" },
        },
        take: 5,
      });
      for (const t of tasks) {
        results.push({ type: "task", id: t.id, title: t.title, href: `/tasks/${t.id}` });
      }
    }

    if (can(principal, "READ", "PAYMENT_REQUEST")) {
      const reqs = await prisma.paymentRequest.findMany({
        where: {
          entityId: principal.entityId,
          OR: [{ number: { contains: q } }, { title: { contains: q, mode: "insensitive" } }],
        },
        take: 5,
      });
      for (const r of reqs) {
        results.push({ type: "payment", id: r.id, title: `${r.number} · ${r.title}`, href: `/payments/${r.id}` });
      }
    }

    return json({ results });
  } catch (error) {
    return errorResponse(error);
  }
}
