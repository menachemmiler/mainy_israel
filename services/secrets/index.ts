import { EnvSecretsDriver } from "./env-driver";
import { VaultSecretsDriver } from "./vault-driver";
import type { SecretName, SecretsDriver } from "./types";

export type { SecretName, SecretsDriver } from "./types";

let cached: SecretsDriver | null = null;

export function getSecretsDriver(): SecretsDriver {
  if (cached) return cached;
  const kind = process.env.SECRETS_DRIVER ?? "env";
  cached = kind === "vault" ? new VaultSecretsDriver() : new EnvSecretsDriver();
  return cached;
}

export async function getSecret(name: SecretName | string, fallback?: string): Promise<string> {
  const value = (await getSecretsDriver().get(name)) ?? fallback;
  if (value == null || value === "") {
    throw new Error(`Missing secret: ${name}`);
  }
  return value;
}

export async function getSecretOptional(name: SecretName | string): Promise<string | undefined> {
  return getSecretsDriver().get(name);
}

export function resetSecretsDriverForTests() {
  cached = null;
}
