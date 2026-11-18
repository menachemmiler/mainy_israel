import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFibiClient, exchangeAuthorizationCode, storeTokenSet } from "@/services/fibi";

function appOrigin(request: Request) {
  const url = new URL(request.url);
  return process.env.APP_URL ?? `${url.protocol}//${url.host}`;
}

function redirectHome(request: Request, params: Record<string, string>) {
  const dest = new URL("/banking/connections", appOrigin(request));
  for (const [key, value] of Object.entries(params)) dest.searchParams.set(key, value);
  return NextResponse.redirect(dest);
}

/**
 * Bank 302-redirects here with access_code (spec 1.4.2) or code.
 * Exchange happens on the server; the yearly refresh token is stored encrypted.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      return redirectHome(request, {
        oauth: "error",
        message: url.searchParams.get("error_description") ?? oauthError,
      });
    }

    const code = url.searchParams.get("access_code") ?? url.searchParams.get("code");
    const bankAccountId = url.searchParams.get("state");
    if (!code || !bankAccountId) {
      return redirectHome(request, { oauth: "error", message: "חסר קוד הרשאה או חשבון יעד" });
    }

    const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account) {
      return redirectHome(request, { oauth: "error", message: "חשבון לא נמצא" });
    }

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
    return redirectHome(request, { oauth: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "החלפת הקוד נכשלה";
    return redirectHome(request, { oauth: "error", message });
  }
}
