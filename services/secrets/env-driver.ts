import type { SecretName, SecretsDriver } from "./types";

/** Local development driver. Reads process.env / .env.local. */
export class EnvSecretsDriver implements SecretsDriver {
  readonly name = "env";

  async get(name: SecretName | string): Promise<string | undefined> {
    const value = process.env[name];
    return value && value.length > 0 ? value : undefined;
  }
}
