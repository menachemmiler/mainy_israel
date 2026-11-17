export function decodeTransactionId(transactionId?: string) {
  if (!transactionId) return undefined;
  try {
    const json = Buffer.from(transactionId, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { id?: string; timestamp?: string };
    return { id: parsed.id, timestamp: parsed.timestamp, raw: parsed };
  } catch {
    return { raw: transactionId };
  }
}

export function mockTransactionId(id: string, timestamp = new Date()): string {
  return Buffer.from(JSON.stringify({ id, timestamp: timestamp.toISOString() }), "utf8").toString("base64");
}

export class DuplicateSubmitError extends Error {
  constructor(
    message: string,
    public existingDraftId: string,
    public status: string,
  ) {
    super(message);
    this.name = "DuplicateSubmitError";
  }
}
