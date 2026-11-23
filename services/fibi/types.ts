export type FibiEnv = "sb" | "prd";
export type FibiWriteMode = "mock" | "live";
export type FibiCurrency = "ILS" | "USD";

export type FibiConfig = {
  env: FibiEnv;
  baseUrl: string;
  tokenUrl: string;
  authorizeUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  oauthScope: string;
  writeMode: FibiWriteMode;
  acceptLanguage: string;
};

export type FibiStandardHeaders = {
  Accept: "application/json";
  "Content-Type": "application/json";
  "Accept-Language": string;
  "X-IBM-Client-Id": string;
  "X-IBM-Client-Secret": string;
  Authorization: string;
};

export type AccountTransactionsQuery = {
  branch: string;
  account: string;
  fromDate: string;
  toDate: string;
  accountType?: string;
  currencyIso?: FibiCurrency;
};

export type FibiTransaction = {
  registerDate?: string;
  valueDate?: string;
  amount?: number | string;
  actionType?: string;
  actionCode?: string | number;
  currency?: string;
  openingBalance?: number | string;
  closingBalance?: number | string;
  transactionCounter?: string | number;
  contraBank?: string;
  contraBranch?: string;
  contraAccount?: string;
  beneficiaryName?: string;
  transactionReason?: string;
  description?: string;
  reference?: string;
  [key: string]: unknown;
};

export type AccountTransactionsResult = {
  transactions: FibiTransaction[];
  openingBalance?: string;
  closingBalance?: string;
  currency?: string;
  raw: unknown;
};

export type IsraeliTransferDraftInput = {
  branchId: string;
  accountId: string;
  bank: string;
  branch: string;
  account: string;
  beneficiary_name: string;
  amount: number | string;
  category?: string;
  transfer_date: string;
  is_rtgs?: boolean;
  comment?: string;
  other_comment?: string;
};

export type BatchTransferItemInput = {
  bank: string;
  branch: string;
  account: string;
  beneficiary_name: string;
  amount: number | string;
  is_rtgs?: boolean;
  comment?: string;
  other_comment?: string;
};

export type BatchTransferDraftInput = {
  branchId: string;
  accountId: string;
  list_name: string;
  list_description?: string;
  is_salary_transfer?: boolean;
  transfer_date: string;
  action_type: "Load & open draft";
  category?: string;
  transfer_list: BatchTransferItemInput[];
};

export type TransferDraftBankResponse = {
  transaction_id?: string;
  decoded?: { id?: string; timestamp?: string; raw?: unknown };
  raw: unknown;
  mock: boolean;
};

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  tokenType: string;
};

export type FibiErrorBody = {
  status: number;
  message: string;
  details?: unknown;
};
