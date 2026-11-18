import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, errorResponse, requirePermission } from "@/lib/api/http";
import { createFibiClient } from "@/services/fibi";
import { buildAuthorizeUrl } from "@/services/fibi/auth/authorize";

export async function GET(request: Request) {
  try {
    await requirePermission({ action: "MANAGE_CONNECTION", domain: "INTEGRATION" });
    const bankAccountId = new URL(request.url).searchParams.get("bankAccountId");
    if (!bankAccountId) throw new ApiError(400, "חסר מזהה חשבון בנק");

    const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account) throw new ApiError(404, "חשבון לא נמצא");

    const { config } = await createFibiClient();
    const authorizeUrl = buildAuthorizeUrl(config, account.id);

    const probe = await fetch(authorizeUrl, { method: "GET", redirect: "manual", cache: "no-store" });
    if (probe.status === 404) {
      const dest = new URL("/banking/connections", process.env.APP_URL ?? request.url);
      dest.searchParams.set("oauth", "error");
      dest.searchParams.set(
        "message",
        `הבנק החזיר 404 לכתובת ההזדהות. אין API בשם oauth2/authorize ב־${config.authorizeUrl}. בקשו מהבנקאי את Authorization URL ואת Token URL מתוך קטלוג המפתחים.`,
      );
      return NextResponse.redirect(dest);
    }

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    return errorResponse(error);
  }
}
