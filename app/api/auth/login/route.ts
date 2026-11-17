import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { errorResponse, json, writeAudit } from "@/lib/api/http";
import { loadPrincipal } from "@/lib/auth/principal";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const user = await prisma.user.findFirst({
      where: { email: body.email.toLowerCase(), isActive: true },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return json({ error: "דוא״ל או סיסמה שגויים" }, 401);
    }
    await setSessionCookie({ sub: user.id, entityId: user.entityId, email: user.email });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const principal = await loadPrincipal({ sub: user.id, entityId: user.entityId, email: user.email });
    if (principal) {
      await writeAudit({
        principal,
        action: "login",
        domain: "SETTINGS",
        recordType: "User",
        recordId: user.id,
      });
    }
    return json({
      user: { id: user.id, nameHe: user.nameHe, email: user.email, entityId: user.entityId },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
