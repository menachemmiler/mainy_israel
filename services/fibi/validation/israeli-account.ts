import { money } from "@/lib/money";
import type { BatchTransferDraftInput, BatchTransferItemInput, IsraeliTransferDraftInput } from "../types";

const BANK_RE = /^\d{2}$/;
const BRANCH_RE = /^\d{3}$/;
const ACCOUNT_RE = /^\d{4,10}$/;

export type FieldError = { path: string; message: string };

export function validateIsraeliBeneficiary(
  item: BatchTransferItemInput,
  pathPrefix = "",
): FieldError[] {
  const errors: FieldError[] = [];
  const p = (field: string) => (pathPrefix ? `${pathPrefix}.${field}` : field);

  if (!BANK_RE.test(item.bank)) {
    errors.push({ path: p("bank"), message: "קוד בנק חייב להיות 2 ספרות" });
  }
  if (!BRANCH_RE.test(item.branch)) {
    errors.push({ path: p("branch"), message: "סניף חייב להיות 3 ספרות" });
  }
  if (!ACCOUNT_RE.test(item.account)) {
    errors.push({ path: p("account"), message: "מספר חשבון לא תקין" });
  }
  if (!item.beneficiary_name?.trim()) {
    errors.push({ path: p("beneficiary_name"), message: "שם מוטב חובה" });
  }
  try {
    if (money(item.amount).lte(0)) {
      errors.push({ path: p("amount"), message: "סכום חייב להיות חיובי" });
    }
  } catch {
    errors.push({ path: p("amount"), message: "סכום לא תקין" });
  }
  return errors;
}

export function validateSingleDraft(input: IsraeliTransferDraftInput): FieldError[] {
  const errors = validateIsraeliBeneficiary(input);
  if (!input.branchId) errors.push({ path: "branchId", message: "סניף מקור חובה" });
  if (!input.accountId) errors.push({ path: "accountId", message: "חשבון מקור חובה" });
  if (!input.transfer_date) errors.push({ path: "transfer_date", message: "תאריך העברה חובה" });
  return errors;
}

/**
 * Strict batch validation: if a single line fails, the entire batch is rejected.
 * Bank behavior: 2–99 items; one invalid account rejects the whole list.
 */
export function validateBatchDraft(input: BatchTransferDraftInput): FieldError[] {
  const errors: FieldError[] = [];
  if (!input.list_name?.trim()) errors.push({ path: "list_name", message: "שם רשימה חובה" });
  if (!input.transfer_date) errors.push({ path: "transfer_date", message: "תאריך העברה חובה" });
  if (input.action_type !== "Load & open draft") {
    errors.push({ path: "action_type", message: 'action_type חייב להיות "Load & open draft"' });
  }
  const list = input.transfer_list ?? [];
  if (list.length < 2 || list.length > 99) {
    errors.push({ path: "transfer_list", message: "אצווה חייבת להכיל בין 2 ל־99 העברות" });
  }
  list.forEach((item, i) => {
    errors.push(...validateIsraeliBeneficiary(item, `transfer_list[${i}]`));
  });
  return errors;
}

export class BatchValidationError extends Error {
  constructor(public errors: FieldError[]) {
    super("האצווה נדחתה: שורה אחת פגומה פוסלת את כל הרשימה");
    this.name = "BatchValidationError";
  }
}
