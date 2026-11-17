import { prisma } from "@/lib/db";
import { can, maskNationalId } from "@/lib/rbac/engine";
import { errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "CONTACT" });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const role = searchParams.get("role");

    const contacts = await prisma.contact.findMany({
      where: {
        entityId: principal.entityId,
        mergedIntoId: null,
        ...(role ? { roles: { some: { role } } } : {}),
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { firstName: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { roles: true, channels: true },
      orderBy: { displayName: "asc" },
      take: 100,
    });

    const allowId = can(principal, "READ", "CONTACT", undefined, "nationalId");
    return json({
      items: contacts.map((c) => ({
        ...c,
        nationalId: maskNationalId(c.nationalId, allowId),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  kind: z.enum(["PERSON", "FAMILY", "ORGANIZATION"]).default("PERSON"),
  displayName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  roles: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "CREATE", domain: "CONTACT" });
    const body = createSchema.parse(await request.json());
    const contact = await prisma.contact.create({
      data: {
        entityId: principal.entityId,
        kind: body.kind,
        displayName: body.displayName,
        firstName: body.firstName,
        lastName: body.lastName,
        city: body.city,
        roles: { create: body.roles.map((role) => ({ role })) },
      },
    });
    await writeAudit({
      principal,
      action: "create",
      domain: "CONTACT",
      recordType: "Contact",
      recordId: contact.id,
      after: { displayName: contact.displayName },
    });
    return json({ item: contact }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
