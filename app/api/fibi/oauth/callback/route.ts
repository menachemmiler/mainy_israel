import { prisma } from "@/lib/db";
import { errorResponse, json } from "@/lib/api/http";
import { createFibiClient, exchangeAuthorizationCode, storeTokenSet } from "@/services/fibi";

/**
 * Server-side OAuth callback. Secrets never reach the browser.
 * First-time consent stores the refresh token (1 year) encrypted at rest.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const bankAccountId = url.searchParams.get("state");
    if (!code || !bankAccountId) {
      return json({ error: "חסר קוד הרשאה או חשבון יעד" }, 400);
    }
    const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account) return json({ error: "חשבון לא נמצא" }, 404);

    const { config } = await createFibiClient();
    const tokens = await exchangeAuthorizationCode(config, code);
    await storeTokenSet({
      config,
      bankAccountId: account.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      tokenType: tokens.tokenType,
    });
    await prisma.integrationConnection.updateMany({
      where: { bankAccountId: account.id },
      data: { accessExists: true, status: "CONNECTED" },
    });
    return json({ ok: true, bankAccountId: account.id });
  } catch (error) {
    return errorResponse(error);
  }
}
