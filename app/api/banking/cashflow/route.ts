import cashflowFile from "@/data/cashflow.json";
import { prisma } from "@/lib/db";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { todayIl, toIsoDate } from "@/lib/dates";
import {
  buildForecast,
  CERTAINTY_ORDER,
  scenarioBlocksApply,
  type Certainty,
  type ScenarioDef,
} from "@/lib/cashflow/forecast";
import { money } from "@/lib/money";

const file = cashflowFile as {
  horizonDays: number;
  creditLine: string;
  restricted: { fund: string; amount: string; noteHe: string }[];
  scenarios: ScenarioDef[];
  items: Parameters<typeof buildForecast>[0]["items"];
};

function parseCertainty(raw: string | null): Certainty[] {
  if (!raw) return [...CERTAINTY_ORDER];
  const asked = raw.split(",").filter((c): c is Certainty => (CERTAINTY_ORDER as readonly string[]).includes(c));
  return asked.length ? asked : [...CERTAINTY_ORDER];
}

export async function GET(request: Request) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "CASHFLOW" });
    const url = new URL(request.url);
    const scenarioId = url.searchParams.get("scenario") ?? "base";
    const currency = url.searchParams.get("currency") ?? "ILS";
    const horizon = Number(url.searchParams.get("horizon") ?? file.horizonDays);
    const enabledCertainty = parseCertainty(url.searchParams.get("certainty"));

    const account = await prisma.bankAccount.findFirst({
      where: { entityId: principal.entityId, currency: currency as "ILS" | "USD" | "EUR" },
      orderBy: { labelHe: "asc" },
    });
    if (!account) throw new ApiError(404, "לא נמצא חשבון במטבע המבוקש");

    const scenario = file.scenarios.find((s) => s.id === scenarioId) ?? file.scenarios[0];
    const baseScenario = file.scenarios.find((s) => s.kind === "BASE") ?? file.scenarios[0];
    const cutoff = toIsoDate(todayIl());
    const restricted = file.restricted.reduce((sum, slice) => sum.plus(money(slice.amount)), money(0));
    const opening = account.currentBalance ?? 0;

    const current = buildForecast({
      openingBalance: opening,
      cutoff,
      horizonDays: Number.isFinite(horizon) ? horizon : file.horizonDays,
      items: file.items,
      scenario,
      enabledCertainty,
      restricted,
      currency,
    });
    const baseline = buildForecast({
      openingBalance: opening,
      cutoff,
      horizonDays: Number.isFinite(horizon) ? horizon : file.horizonDays,
      items: file.items,
      scenario: baseScenario,
      enabledCertainty: scenario.kind === "CONSERVATIVE" ? enabledCertainty : [...CERTAINTY_ORDER],
      restricted,
      currency,
    });

    const availableNow = money(opening).minus(restricted);

    return json({
      cutoff,
      refreshedAt: account.lastSyncedAt,
      account: {
        id: account.id,
        labelHe: account.labelHe,
        currency: account.currency,
      },
      openingBalance: money(opening).toFixed(2),
      restricted: file.restricted,
      restrictedTotal: restricted.toFixed(2),
      creditLine: file.creditLine,
      availableNow: availableNow.toFixed(2),
      currencyPolicyHe: "לא מחברים מטבעות. התחזית בשקלים בנפרד מהדולר, בלי שער המרה.",
      scenarios: file.scenarios,
      scenario,
      certainty: enabledCertainty,
      current,
      baseline: {
        trough: baseline.trough,
        daysInDeficit: baseline.daysInDeficit,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "APPROVE", domain: "CASHFLOW" });
    const body = (await request.json()) as { action?: string; scenarioId?: string };
    const scenario = file.scenarios.find((s) => s.id === body.scenarioId);
    if (!scenario) throw new ApiError(400, "תרחיש לא נמצא");

    const account = await prisma.bankAccount.findFirst({
      where: { entityId: principal.entityId, currency: "ILS" },
    });
    const cutoff = toIsoDate(todayIl());
    const forecast = buildForecast({
      openingBalance: account?.currentBalance ?? 0,
      cutoff,
      horizonDays: file.horizonDays,
      items: file.items,
      scenario,
      enabledCertainty: [...CERTAINTY_ORDER],
      restricted: file.restricted.reduce((sum, slice) => sum.plus(money(slice.amount)), money(0)),
      currency: "ILS",
    });

    if (body.action === "save") {
      await writeAudit({
        principal,
        action: "SAVE_SCENARIO",
        domain: "CASHFLOW",
        recordType: "CashflowScenario",
        recordId: scenario.id,
        after: { trough: forecast.trough, daysInDeficit: forecast.daysInDeficit },
      });
      return json({
        ok: true,
        notice: "התרחיש נשמר להשוואה. לוח התשלומים לא עודכן.",
      });
    }

    if (body.action === "apply") {
      const blocking = scenarioBlocksApply(forecast.included);
      if (blocking.length) {
        throw new ApiError(409, "לא ניתן להחיל: קיימת טיוטת בנק לפריט שהוזז. בדקו את הטיוטה לפני שינוי הלוח.", {
          drafts: blocking.map((item) => item.id),
        });
      }
      await writeAudit({
        principal,
        action: "APPLY_SCENARIO",
        domain: "CASHFLOW",
        recordType: "CashflowScenario",
        recordId: scenario.id,
        reason: "בדיקת מצב דמו — אין עדכון לוח תשלומים",
        after: { trough: forecast.trough },
      });
      return json({
        ok: true,
        notice: "המצב, היתרות והטיוטות נבדקו. במצב דמו לוח התשלומים לא משתנה.",
      });
    }

    throw new ApiError(400, "פעולה לא נתמכת");
  } catch (error) {
    return errorResponse(error);
  }
}
