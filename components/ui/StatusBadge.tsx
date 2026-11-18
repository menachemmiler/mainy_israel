const TONE: Record<string, string> = {
  OPEN: "status-warn",
  WAITING: "status-info",
  DONE: "status-ok",
  CANCELLED: "status-muted",
  ACTIVE: "status-ok",
  TESTING: "status-info",
  MOCK_PREPARED: "status-info",
  AWAITING_SIGNATURES: "status-warn",
  AWAITING_BANK_VERIFY: "status-danger",
  COLLECTED: "status-ok",
  FAILED: "status-danger",
  PENDING: "status-warn",
  CONNECTED: "status-ok",
  DRAFT: "status-muted",
};

const LABEL: Record<string, string> = {
  OPEN: "פתוח",
  WAITING: "ממתין",
  DONE: "טופל",
  CANCELLED: "בוטל",
  ACTIVE: "פעיל",
  TESTING: "בבדיקה",
  MOCK_PREPARED: "מדומה / לא נשלח",
  AWAITING_SIGNATURES: "ממתין לחתימות",
  AWAITING_BANK_VERIFY: "ממתין לאימות בבנק",
  COLLECTED: "נגבה",
  FAILED: "נכשל",
  PENDING: "ממתין",
  LOCAL_DRAFT: "טיוטה מקומית",
  CONNECTED: "מחובר",
  DRAFT: "ממתין לחיבור",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status] ?? "status-muted"}`}>
      {LABEL[status] ?? status}
    </span>
  );
}
