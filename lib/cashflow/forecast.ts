import { money, Decimal } from "@/lib/money";

export const CERTAINTY_ORDER = ["CONFIRMED", "HIGH", "MEDIUM", "LOW"] as const;
export type Certainty = (typeof CERTAINTY_ORDER)[number];
export type CashDirection = "IN" | "OUT";
export type ScenarioKind = "BASE" | "CONSERVATIVE" | "DECISION";

export type CashflowItemInput = {
  id: string;
  offsetDays?: number | null;
  date?: string | null;
  pastValueDays?: number;
  direction: CashDirection;
  amount: string;
  currency: string;
  source: string;
  sourceLabelHe: string;
  description: string;
  certainty: Certainty;
  ownerHe: string;
  version: number;
  accountKey: string;
  division?: string;
  fund?: string;
  project?: string;
  campaign?: string;
  branch?: string;
  linkedDraft?: boolean;
};

export type ScenarioDef = {
  id: string;
  labelHe: string;
  kind: ScenarioKind;
  maxCertainty?: Certainty;
  delayItemId?: string;
  delayDays?: number;
};

export type RestrictedSlice = {
  fund: string;
  amount: string;
  noteHe: string;
};

export type ResolvedItem = CashflowItemInput & {
  date: string | null;
  shifted?: boolean;
};

export type DayRow = {
  date: string;
  opening: string;
  inflow: string;
  outflow: string;
  closing: string;
  available: string;
  items: ResolvedItem[];
};

export type Decision = {
  id: string;
  kind: "NEAR_PAYMENT" | "NO_DATE" | "FORECAST_BREACH" | "PAST_VALUE_CHECK" | "LATE_RECEIPT" | "DRAFT_BLOCK";
  titleHe: string;
  detailHe: string;
  amount: string;
  date: string | null;
  ownerHe: string;
  itemId?: string;
};

export type ForecastResult = {
  series: DayRow[];
  undated: ResolvedItem[];
  included: ResolvedItem[];
  trough: { date: string; balance: string };
  daysInDeficit: number;
  daysAvailableNegative: number;
  decisions: Decision[];
};

const RANK: Record<Certainty, number> = {
  CONFIRMED: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function addIsoDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveItemDate(item: CashflowItemInput, cutoff: string): string | null {
  if (item.date) return item.date;
  if (item.offsetDays == null) return null;
  return addIsoDays(cutoff, item.offsetDays);
}

function allowedCertainty(enabled: Certainty[], max?: Certainty): Certainty[] {
  const cap = max ? RANK[max] : RANK.LOW;
  return enabled.filter((c) => RANK[c] <= cap);
}

export function applyScenario(items: ResolvedItem[], scenario: ScenarioDef): ResolvedItem[] {
  if (!scenario.delayItemId || !scenario.delayDays) return items;
  return items.map((item) => {
    if (item.id !== scenario.delayItemId || !item.date) return item;
    return {
      ...item,
      date: addIsoDays(item.date, scenario.delayDays),
      shifted: true,
    };
  });
}

export function buildForecast(opts: {
  openingBalance: Decimal.Value;
  cutoff: string;
  horizonDays: number;
  items: CashflowItemInput[];
  scenario: ScenarioDef;
  enabledCertainty: Certainty[];
  restricted: Decimal.Value;
  currency: string;
}): ForecastResult {
  const enabled = allowedCertainty(opts.enabledCertainty, opts.scenario.maxCertainty);
  const resolved: ResolvedItem[] = opts.items
    .filter((item) => item.currency === opts.currency)
    .map((item) => ({ ...item, date: resolveItemDate(item, opts.cutoff) }));
  const shifted = applyScenario(resolved, opts.scenario);

  const included = shifted.filter((item) => enabled.includes(item.certainty));
  const undated = included.filter((item) => !item.date);
  const dated = included.filter((item) => item.date);

  const series: DayRow[] = [];
  let balance = money(opts.openingBalance);
  let trough = { date: opts.cutoff, balance: balance.toFixed(2) };
  let daysInDeficit = 0;
  let daysAvailableNegative = 0;
  const restricted = money(opts.restricted);

  for (let i = 0; i < opts.horizonDays; i++) {
    const date = addIsoDays(opts.cutoff, i);
    const dayItems = dated.filter((item) => item.date === date);
    const inflow = dayItems
      .filter((item) => item.direction === "IN")
      .reduce((sum, item) => sum.plus(money(item.amount)), money(0));
    const outflow = dayItems
      .filter((item) => item.direction === "OUT")
      .reduce((sum, item) => sum.plus(money(item.amount)), money(0));
    const opening = balance;
    balance = money(opening.plus(inflow).minus(outflow));
    const available = money(balance.minus(restricted));
    if (balance.lt(money(trough.balance))) {
      trough = { date, balance: balance.toFixed(2) };
    }
    if (balance.lt(0)) daysInDeficit += 1;
    if (available.lt(0)) daysAvailableNegative += 1;
    series.push({
      date,
      opening: opening.toFixed(2),
      inflow: inflow.toFixed(2),
      outflow: outflow.toFixed(2),
      closing: balance.toFixed(2),
      available: available.toFixed(2),
      items: dayItems,
    });
  }

  return {
    series,
    undated,
    included,
    trough,
    daysInDeficit,
    daysAvailableNegative,
    decisions: buildDecisions({
      cutoff: opts.cutoff,
      series,
      undated,
      included,
      daysInDeficit,
      trough,
    }),
  };
}

function buildDecisions(opts: {
  cutoff: string;
  series: DayRow[];
  undated: ResolvedItem[];
  included: ResolvedItem[];
  daysInDeficit: number;
  trough: { date: string; balance: string };
}): Decision[] {
  const decisions: Decision[] = [];
  const nearEnd = addIsoDays(opts.cutoff, 3);

  for (const item of opts.included) {
    if (item.direction === "OUT" && item.date && item.date >= opts.cutoff && item.date <= nearEnd) {
      decisions.push({
        id: `near-${item.id}`,
        kind: "NEAR_PAYMENT",
        titleHe: "תשלום קרוב",
        detailHe: item.description,
        amount: item.amount,
        date: item.date,
        ownerHe: item.ownerHe,
        itemId: item.id,
      });
    }
    if (item.pastValueDays && item.pastValueDays > 0) {
      decisions.push({
        id: `past-${item.id}`,
        kind: "PAST_VALUE_CHECK",
        titleHe: "צ׳ק שעבר תאריך ערך",
        detailHe: `${item.description} · נשאר צפוי עד פירעון`,
        amount: item.amount,
        date: item.date,
        ownerHe: item.ownerHe,
        itemId: item.id,
      });
    }
    if (item.shifted && item.direction === "IN") {
      decisions.push({
        id: `late-${item.id}`,
        kind: "LATE_RECEIPT",
        titleHe: "תקבול באיחור",
        detailHe: `${item.description} הוזז בתרחיש ל־${item.date}`,
        amount: item.amount,
        date: item.date,
        ownerHe: item.ownerHe,
        itemId: item.id,
      });
    }
    if (item.shifted && item.linkedDraft) {
      decisions.push({
        id: `draft-${item.id}`,
        kind: "DRAFT_BLOCK",
        titleHe: "טיוטת בנק קיימת",
        detailHe: "אין להחיל שינוי בלוח לפני בדיקת הטיוטה וביטול מאומת אם כבר נשלחה",
        amount: item.amount,
        date: item.date,
        ownerHe: item.ownerHe,
        itemId: item.id,
      });
    }
  }

  for (const item of opts.undated) {
    decisions.push({
      id: `nodate-${item.id}`,
      kind: "NO_DATE",
      titleHe: "ללא מועד",
      detailHe: item.description,
      amount: item.amount,
      date: null,
      ownerHe: item.ownerHe,
      itemId: item.id,
    });
  }

  if (opts.daysInDeficit > 0) {
    decisions.push({
      id: "breach",
      kind: "FORECAST_BREACH",
      titleHe: "חריגה חזויה",
      detailHe: `נקודת שפל ${opts.trough.date} · ${opts.daysInDeficit} ימים ביתרה שלילית`,
      amount: opts.trough.balance,
      date: opts.trough.date,
      ownerHe: "יוסף גזבר",
    });
  }

  return decisions;
}

export function scenarioBlocksApply(items: ResolvedItem[]): ResolvedItem[] {
  return items.filter((item) => item.shifted && item.linkedDraft);
}
