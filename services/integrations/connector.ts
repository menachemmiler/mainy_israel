/**
 * Generic connector contract. v1 ships FIBI only.
 * A future PAGI connector implements the same surface and is registered in the catalog.
 */
export type ConnectorCapability = {
  accessExists: boolean;
  dataRead: boolean;
  writeAllowed: boolean;
  capabilityVerified: boolean;
};

export type ConnectorDescriptor = {
  provider: string;
  labelHe: string;
  environments: Array<"SANDBOX" | "PRODUCTION">;
  implemented: boolean;
};

export const CONNECTOR_CATALOG: ConnectorDescriptor[] = [
  { provider: "FIBI", labelHe: "הבנק הבינלאומי", environments: ["SANDBOX", "PRODUCTION"], implemented: true },
  { provider: "PAGI", labelHe: "בנק פאג״י", environments: ["SANDBOX", "PRODUCTION"], implemented: false },
  { provider: "APT", labelHe: "APT", environments: ["PRODUCTION"], implemented: false },
  { provider: "NEDARIM", labelHe: "נדרים פלוס", environments: ["PRODUCTION"], implemented: false },
  { provider: "GOOGLE_DRIVE", labelHe: "Google Drive", environments: ["PRODUCTION"], implemented: false },
  { provider: "GOOGLE_SHEETS", labelHe: "Google Sheets", environments: ["PRODUCTION"], implemented: false },
];
