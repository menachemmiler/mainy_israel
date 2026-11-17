import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto/token-cipher";

const KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("token cipher", () => {
  it("encrypts and decrypts refresh tokens", () => {
    const cipher = encryptSecret("refresh-token-value", KEY);
    expect(cipher).not.toContain("refresh-token-value");
    expect(decryptSecret(cipher, KEY)).toBe("refresh-token-value");
  });
});
