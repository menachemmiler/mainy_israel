import type { FibiConfig } from "../types";

/**
 * Independent redirect (FIBI 1.4.2): send the end-user browser to OAuth2/Authorize.
 * redirect_url must match the URL registered in the developer catalog.
 */
export function buildAuthorizeUrl(config: FibiConfig, state: string): string {
  if (!config.redirectUri) {
    throw new Error("חסרה כתובת FIBI_REDIRECT_URI");
  }
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("redirect_url", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}
