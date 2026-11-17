import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto/token-cipher";
import { getSecret } from "@/services/secrets";
import { accessTokenNeedsRefresh, exchangeRefreshToken } from "./oauth";
import type { FibiConfig } from "../types";
import type { BankEnvironment } from "@prisma/client";

export class MissingBankTokenError extends Error {
  constructor(message = "אין אסימון רענון מאוחסן לחשבון זה") {
    super(message);
    this.name = "MissingBankTokenError";
  }
}

async function encryptionKey() {
  return getSecret("TOKEN_ENCRYPTION_KEY");
}

function envToDb(env: FibiConfig["env"]): BankEnvironment {
  return env === "prd" ? "PRODUCTION" : "SANDBOX";
}

export async function getValidAccessToken(config: FibiConfig, bankAccountId: string): Promise<string> {
  const row = await prisma.oAuthToken.findFirst({
    where: { bankAccountId, provider: "FIBI", environment: envToDb(config.env) },
    orderBy: { updatedAt: "desc" },
  });
  if (!row) throw new MissingBankTokenError();

  const key = await encryptionKey();
  if (!accessTokenNeedsRefresh(row.accessExpiresAt)) {
    return decryptSecret(row.accessTokenCipher, key);
  }

  const refresh = decryptSecret(row.refreshTokenCipher, key);
  const tokens = await exchangeRefreshToken(config, refresh);
  await prisma.oAuthToken.update({
    where: { id: row.id },
    data: {
      accessTokenCipher: encryptSecret(tokens.accessToken, key),
      refreshTokenCipher: encryptSecret(tokens.refreshToken, key),
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      tokenType: tokens.tokenType,
    },
  });
  return tokens.accessToken;
}

export async function storeTokenSet(opts: {
  config: FibiConfig;
  bankAccountId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  tokenType?: string;
}) {
  const key = await encryptionKey();
  const environment = envToDb(opts.config.env);
  const existing = await prisma.oAuthToken.findFirst({
    where: { bankAccountId: opts.bankAccountId, provider: "FIBI", environment },
  });
  const data = {
    accessTokenCipher: encryptSecret(opts.accessToken, key),
    refreshTokenCipher: encryptSecret(opts.refreshToken, key),
    accessExpiresAt: opts.accessExpiresAt,
    refreshExpiresAt: opts.refreshExpiresAt,
    tokenType: opts.tokenType ?? "Bearer",
    environment,
    provider: "FIBI",
    bankAccountId: opts.bankAccountId,
  };
  if (existing) {
    return prisma.oAuthToken.update({ where: { id: existing.id }, data });
  }
  return prisma.oAuthToken.create({ data });
}
