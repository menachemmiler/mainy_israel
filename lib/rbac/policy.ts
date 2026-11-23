import type { ActionCode, DomainCode, RoleCode } from "@prisma/client";

type RolePolicy = {
  domains: Partial<Record<DomainCode, ActionCode[]>>;
};

const ALL_READ: ActionCode[] = ["READ"];
const READ_CREATE: ActionCode[] = ["READ", "CREATE"];
const WORK: ActionCode[] = ["READ", "CREATE", "UPDATE"];
const ALLOCATE: ActionCode[] = ["READ", "CREATE", "UPDATE", "ALLOCATE"];
const APPROVE: ActionCode[] = ["READ", "CREATE", "UPDATE", "ALLOCATE", "APPROVE"];
const TREASURY_CORE: ActionCode[] = [
  "READ",
  "CREATE",
  "UPDATE",
  "ALLOCATE",
  "APPROVE",
];

/**
 * Positive permissions by role. Grants accumulate only within assigned scopes.
 * Explicit field restrictions always win. Bank signature is never granted here.
 */
export const ROLE_POLICY: Record<RoleCode, RolePolicy> = {
  TREASURER: {
    domains: {
      ORGANIZATION: ALL_READ,
      CONTACT: WORK,
      DONOR: WORK,
      VENDOR: WORK,
      TASK: APPROVE,
      BUDGET: TREASURY_CORE,
      PROJECT: TREASURY_CORE,
      PAYMENT_REQUEST: APPROVE,
      BANK: ["READ", "CREATE", "UPDATE", "ALLOCATE"],
      CASHFLOW: TREASURY_CORE,
      REPORT: ["READ", "EXPORT"],
      INTEGRATION: ["READ", "MANAGE_CONNECTION"],
      COMMUNICATION: WORK,
      SETTINGS: ALL_READ,
    },
  },
  FUNDRAISING_MANAGER: {
    domains: {
      CONTACT: WORK,
      DONOR: ALLOCATE,
      TASK: APPROVE,
      BUDGET: ALL_READ,
      PROJECT: ALL_READ,
      REPORT: ["READ"],
      COMMUNICATION: WORK,
    },
  },
  DIVISION_MANAGER: {
    domains: {
      CONTACT: ALL_READ,
      DONOR: ["READ", "CREATE", "UPDATE", "ALLOCATE", "APPROVE"],
      TASK: WORK,
      BUDGET: APPROVE,
      PROJECT: APPROVE,
      PAYMENT_REQUEST: APPROVE,
      REPORT: ["READ"],
      COMMUNICATION: WORK,
    },
  },
  PROJECT_MANAGER: {
    domains: {
      PROJECT: ["READ", "CREATE", "UPDATE"],
      PAYMENT_REQUEST: ["READ", "CREATE", "UPDATE"],
      TASK: WORK,
      BUDGET: ALL_READ,
    },
  },
  COLLECTOR: {
    domains: {
      CONTACT: ALL_READ,
      DONOR: ["READ", "UPDATE"],
      TASK: WORK,
      COMMUNICATION: ["READ", "CREATE"],
    },
  },
  INTAKE: {
    domains: {
      PAYMENT_REQUEST: ["READ", "CREATE", "UPDATE"],
      CONTACT: ["READ", "CREATE", "UPDATE"],
      TASK: WORK,
    },
  },
  PAYROLL: {
    domains: {
      PAYROLL: APPROVE,
      TASK: WORK,
      REPORT: ["READ"],
    },
  },
  VENDOR: {
    domains: {
      PAYMENT_REQUEST: ["READ", "CREATE", "UPDATE"],
      COMMUNICATION: ["READ", "CREATE"],
    },
  },
  EXECUTIVE: {
    domains: {
      ORGANIZATION: ALL_READ,
      BUDGET: ALL_READ,
      PROJECT: ALL_READ,
      BANK: ALL_READ,
      CASHFLOW: ALL_READ,
      DONOR: ALL_READ,
      REPORT: ["READ"],
      TASK: ALL_READ,
    },
  },
  AUDITOR: {
    domains: {
      ORGANIZATION: ALL_READ,
      BUDGET: ALL_READ,
      BANK: ALL_READ,
      CASHFLOW: ALL_READ,
      DONOR: ALL_READ,
      PAYMENT_REQUEST: ALL_READ,
      REPORT: ["READ", "EXPORT"],
    },
  },
  SYSTEM_ADMIN: {
    domains: {
      SETTINGS: ["READ", "CREATE", "UPDATE", "MANAGE_CONNECTION"],
      INTEGRATION: ["READ", "MANAGE_CONNECTION"],
      ORGANIZATION: ["READ", "UPDATE"],
    },
  },
  SERVICE_ACCOUNT: {
    domains: {
      INTEGRATION: ["READ", "CREATE", "MANAGE_CONNECTION"],
    },
  },
};

export const SENSITIVE_FIELDS = {
  nationalId: "nationalId",
  fullBankAccount: "fullBankAccount",
  payrollLine: "payrollLine",
  charityCase: "charityCase",
  privateNote: "privateNote",
} as const;

export const ROLE_LABEL_HE: Record<RoleCode, string> = {
  TREASURER: "גזבר",
  FUNDRAISING_MANAGER: "מנהל גיוס רוחבי",
  DIVISION_MANAGER: "מנהל אגף",
  PROJECT_MANAGER: "מנהל פרויקט / מפיק",
  COLLECTOR: "נציג גבייה",
  INTAKE: "קליטה",
  PAYROLL: "שכר",
  VENDOR: "ספק / זכאי",
  EXECUTIVE: "הנהלה",
  AUDITOR: "מבקר",
  SYSTEM_ADMIN: "מנהל מערכת",
  SERVICE_ACCOUNT: "חשבון שירות",
};

export const ACTION_LABEL_HE: Record<ActionCode, string> = {
  READ: "קריאה",
  CREATE: "יצירה",
  UPDATE: "עריכה",
  ALLOCATE: "הקצאה",
  APPROVE: "אישור",
  TRANSMIT_BANK: "שידור לבנק",
  DOWNLOAD_DOCUMENT: "הורדת מסמך",
  EXPORT: "ייצוא",
  SHARE: "שיתוף",
  MANAGE_CONNECTION: "ניהול חיבור",
};

export const DOMAIN_LABEL_HE: Record<DomainCode, string> = {
  ORGANIZATION: "ארגון",
  CONTACT: "אלפון",
  DONOR: "תורמים",
  VENDOR: "ספקים",
  TASK: "משימות",
  BUDGET: "תקציב",
  PROJECT: "פרויקטים",
  PAYMENT_REQUEST: "בקשות תשלום",
  PAYROLL: "שכר",
  CHARITY_CASE: "תיקי חסד",
  BANK: "בנק",
  CASHFLOW: "תזרים",
  REPORT: "דוחות",
  INTEGRATION: "חיבורים",
  COMMUNICATION: "תקשורת",
  SETTINGS: "הגדרות",
};
