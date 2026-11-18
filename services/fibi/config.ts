import { getSecret, getSecretOptional } from "@/services/secrets";
import type { FibiConfig, FibiEnv, FibiWriteMode } from "./types";

export async function loadFibiConfig(): Promise<FibiConfig> {
  const env = ((await getSecretOptional("FIBI_ENV")) ?? "sb") as FibiEnv;
  const defaultBase =
    env === "prd" ? "https://api.fibi.co.il/fibi/prd" : "https://api.fibi.co.il:8443/fibi/sb";
  const defaultToken =
    env === "prd"
      ? "https://api.fibi.co.il/fibi/prd/oauth2/token"
      : "https://api.fibi.co.il:8443/fibi/sb/oauth2/token";
  const defaultAuthorize =
    env === "prd"
      ? "https://api.fibi.co.il/fibi/prd/oauth2/authorize"
      : "https://api.fibi.co.il:8443/fibi/sb/oauth2/authorize";

  return {
    env,
    baseUrl: (await getSecretOptional("FIBI_BASE_URL")) ?? defaultBase,
    tokenUrl: (await getSecretOptional("FIBI_TOKEN_URL")) ?? defaultToken,
    authorizeUrl: (await getSecretOptional("FIBI_AUTHORIZE_URL")) ?? defaultAuthorize,
    clientId: await getSecret("FIBI_CLIENT_ID"),
    clientSecret: await getSecret("FIBI_CLIENT_SECRET"),
    redirectUri: (await getSecretOptional("FIBI_REDIRECT_URI")) ?? "",
    writeMode: ((await getSecretOptional("FIBI_WRITE_MODE")) ?? "mock") as FibiWriteMode,
    acceptLanguage: (await getSecretOptional("FIBI_ACCEPT_LANGUAGE")) ?? "HE",
  };
}

export function joinFibiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
