import type { SecretName, SecretsDriver } from "./types";

/**
 * Production placeholder. Swap SECRETS_DRIVER=vault and implement
 * AWS Secrets Manager / Google Secret Manager here.
 * Bank and OAuth code always go through `getSecret()` and never read env directly.
 */
export class VaultSecretsDriver implements SecretsDriver {
  readonly name = "vault";

  async get(name: SecretName | string): Promise<string | undefined> {
    throw new Error(
      `Vault driver is not configured for ${name}. Implement AWS/GCP secret retrieval before production.`,
    );
  }
}
