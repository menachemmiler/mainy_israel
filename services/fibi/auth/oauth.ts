import { fibiUnauthenticatedHeaders } from "../headers";
import type { FibiConfig, TokenSet } from "../types";
import { FibiApiError } from "../client";

const ACCESS_TTL_MS = 20 * 60 * 1000;
const REFRESH_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export async function exchangeRefreshToken(config: FibiConfig, refreshToken: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      ...fibiUnauthenticatedHeaders(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || typeof json.access_token !== "string") {
    throw new FibiApiError({
      status: response.status,
      message: String(json.error_description ?? json.error ?? "Token refresh failed"),
      details: json,
    });
  }

  const now = Date.now();
  const accessTtl = typeof json.expires_in === "number" ? json.expires_in * 1000 : ACCESS_TTL_MS;
  return {
    accessToken: json.access_token,
    refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : refreshToken,
    accessExpiresAt: new Date(now + accessTtl),
    refreshExpiresAt: new Date(now + REFRESH_TTL_MS),
    tokenType: typeof json.token_type === "string" ? json.token_type : "Bearer",
  };
}

export async function exchangeAuthorizationCode(config: FibiConfig, code: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      ...fibiUnauthenticatedHeaders(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || typeof json.access_token !== "string" || typeof json.refresh_token !== "string") {
    throw new FibiApiError({
      status: response.status,
      message: String(json.error_description ?? json.error ?? "Authorization code exchange failed"),
      details: json,
    });
  }

  const now = Date.now();
  const accessTtl = typeof json.expires_in === "number" ? json.expires_in * 1000 : ACCESS_TTL_MS;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    accessExpiresAt: new Date(now + accessTtl),
    refreshExpiresAt: new Date(now + REFRESH_TTL_MS),
    tokenType: typeof json.token_type === "string" ? json.token_type : "Bearer",
  };
}

export function accessTokenNeedsRefresh(expiresAt: Date, skewMs = 60_000): boolean {
  return expiresAt.getTime() - Date.now() <= skewMs;
}
