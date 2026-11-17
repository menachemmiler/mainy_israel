export type SecretName =
  | "DATABASE_URL"
  | "AUTH_SECRET"
  | "TOKEN_ENCRYPTION_KEY"
  | "FIBI_CLIENT_ID"
  | "FIBI_CLIENT_SECRET"
  | "FIBI_BASE_URL"
  | "FIBI_TOKEN_URL"
  | "FIBI_REDIRECT_URI"
  | "FIBI_ENV"
  | "FIBI_WRITE_MODE"
  | "FIBI_ACCEPT_LANGUAGE"
  | "APP_URL";

export interface SecretsDriver {
  readonly name: string;
  get(name: SecretName | string): Promise<string | undefined>;
}

export type SecretsSnapshot = Partial<Record<SecretName, string>>;
