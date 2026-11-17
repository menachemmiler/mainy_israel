import { fibiHeaders, fibiUnauthenticatedHeaders } from "./headers";
import { joinFibiUrl } from "./config";
import type { FibiConfig, FibiErrorBody } from "./types";

export class FibiApiError extends Error {
  constructor(public body: FibiErrorBody) {
    super(body.message);
    this.name = "FibiApiError";
  }
}

export class FibiClient {
  constructor(private readonly config: FibiConfig) {}

  get writeMode() {
    return this.config.writeMode;
  }

  get environment() {
    return this.config.env;
  }

  url(path: string) {
    return joinFibiUrl(this.config.baseUrl, path);
  }

  async request<T>(opts: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    accessToken: string;
    query?: Record<string, string | undefined>;
    body?: unknown;
  }): Promise<T> {
    const url = new URL(this.url(opts.path));
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value != null && value !== "") url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url, {
      method: opts.method,
      headers: fibiHeaders(this.config, opts.accessToken),
      body: opts.body == null ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
    });

    const text = await response.text();
    const parsed = text ? safeJson(text) : null;

    if (!response.ok) {
      throw new FibiApiError({
        status: response.status,
        message: extractMessage(parsed) ?? `FIBI ${response.status}`,
        details: parsed,
      });
    }
    return parsed as T;
  }

  unauthenticatedHeaders() {
    return fibiUnauthenticatedHeaders(this.config);
  }

  getConfig() {
    return this.config;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractMessage(parsed: unknown): string | undefined {
  if (!parsed || typeof parsed !== "object") return undefined;
  const rec = parsed as Record<string, unknown>;
  const message = rec.message ?? rec.error_description ?? rec.error;
  return typeof message === "string" ? message : undefined;
}
