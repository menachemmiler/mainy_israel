import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { loadPrincipal } from "@/lib/auth/principal";
import { assertAllowed } from "@/lib/rbac/engine";
import type { AccessCheck, AuthPrincipal } from "@/lib/rbac/types";
import { prisma } from "@/lib/db";
import type { DomainCode } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  if (error && typeof error === "object" && "status" in error && "message" in error) {
    const e = error as { status: number; message: string; errors?: unknown; decision?: unknown };
    return NextResponse.json(
      { error: e.message, details: e.errors ?? e.decision },
      { status: e.status || 500 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
}

export async function requirePrincipal(): Promise<AuthPrincipal> {
  const session = await getSessionFromCookies();
  if (!session) throw new ApiError(401, "נדרשת התחברות");
  const principal = await loadPrincipal(session);
  if (!principal) throw new ApiError(401, "המשתמש אינו פעיל");
  return principal;
}

export async function requirePermission(check: AccessCheck): Promise<AuthPrincipal> {
  const principal = await requirePrincipal();
  assertAllowed(principal, check);
  return principal;
}

export async function writeAudit(opts: {
  principal: AuthPrincipal;
  action: string;
  domain: DomainCode;
  recordType?: string;
  recordId?: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditEvent.create({
    data: {
      entityId: opts.principal.entityId,
      actorId: opts.principal.userId,
      action: opts.action,
      domain: opts.domain,
      recordType: opts.recordType,
      recordId: opts.recordId,
      reason: opts.reason,
      before: opts.before as object | undefined,
      after: opts.after as object | undefined,
    },
  });
}
