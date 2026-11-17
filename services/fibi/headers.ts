import type { FibiConfig, FibiStandardHeaders } from "./types";

export function fibiHeaders(config: FibiConfig, accessToken: string): FibiStandardHeaders {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Language": config.acceptLanguage,
    "X-IBM-Client-Id": config.clientId,
    "X-IBM-Client-Secret": config.clientSecret,
    Authorization: `Bearer ${accessToken}`,
  };
}

export function fibiUnauthenticatedHeaders(config: FibiConfig): Omit<FibiStandardHeaders, "Authorization"> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Language": config.acceptLanguage,
    "X-IBM-Client-Id": config.clientId,
    "X-IBM-Client-Secret": config.clientSecret,
  };
}
