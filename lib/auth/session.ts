import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSecret } from "@/services/secrets";

export const SESSION_COOKIE = "mayanei_session";
const TTL_HOURS = 12;

export type SessionPayload = {
  sub: string;
  entityId: string;
  email: string;
};

async function secretKey() {
  const secret = await getSecret("AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_HOURS}h`)
    .sign(await secretKey());
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, await secretKey());
    if (typeof payload.sub !== "string" || typeof payload.entityId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { sub: payload.sub, entityId: payload.entityId, email: payload.email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_HOURS * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}
