import { errorResponse, json, requirePermission } from "@/lib/api/http";
import { syncAccountTransactions } from "@/services/fibi";
import { z } from "zod";

const schema = z.object({
  bankAccountId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  accountType: z.string().optional(),
  currencyIso: z.enum(["ILS", "USD"]).optional(),
});

export async function GET(request: Request) {
  try {
    await requirePermission({ action: "READ", domain: "BANK" });
    const { searchParams } = new URL(request.url);
    const parsed = schema.parse({
      bankAccountId: searchParams.get("bankAccountId"),
      fromDate: searchParams.get("fromDate"),
      toDate: searchParams.get("toDate"),
      accountType: searchParams.get("accountType") ?? undefined,
      currencyIso: searchParams.get("currencyIso") ?? undefined,
    });
    const result = await syncAccountTransactions(parsed);
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
