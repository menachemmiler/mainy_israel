import { PrismaClient, type Currency, type RoleCode, type ScopeType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? "";
  const sep = url.includes("?") ? "&" : "?";
  return url.includes("pool_timeout=") ? url : `${url}${sep}pool_timeout=60`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl() } },
});
const DATA = join(process.cwd(), "data");

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA, file), "utf8")) as T;
}

function daysFromNow(offset = 0) {
  return new Date(Date.now() + offset * 86400000);
}

async function reset() {
  await prisma.auditEvent.deleteMany();
  await prisma.taskEvent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.donationAllocation.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.commitmentAllocation.deleteMany();
  await prisma.commitment.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.ledgerLine.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.bankMatch.deleteMany();
  await prisma.bankCheck.deleteMany();
  await prisma.transferDraftItem.deleteMany();
  await prisma.transferDraft.deleteMany();
  await prisma.bankMovement.deleteMany();
  await prisma.oAuthToken.deleteMany();
  await prisma.integrationRun.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.externalLink.deleteMany();
  await prisma.contactAlias.deleteMany();
  await prisma.contactRelation.deleteMany();
  await prisma.address.deleteMany();
  await prisma.contactChannel.deleteMany();
  await prisma.contactRole.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.fieldRestriction.deleteMany();
  await prisma.temporaryGrant.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.project.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.fund.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.division.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organizationSetting.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.legalEntity.deleteMany();
}

async function main() {
  const org = load<OrgFile>("org.json");
  const usersFile = load<UsersFile>("users.json");
  const contactsFile = load<ContactsFile>("contacts.json");
  const fundraising = load<FundraisingFile>("fundraising.json");
  const tasksFile = load<TasksFile>("tasks.json");
  const banking = load<BankingFile>("banking.json");

  await reset();
  const passwordHash = await bcrypt.hash(usersFile.password, 12);

  const entity = await prisma.legalEntity.create({
    data: {
      name: org.entity.name,
      nameHe: org.entity.nameHe,
      taxId: org.entity.taxId,
      crossDivisionDonorAxis: org.entity.crossDivisionDonorAxis,
      departments: { create: org.departments },
    },
  });

  const divisions: Record<string, string> = {};
  for (const d of org.divisions) {
    const row = await prisma.division.create({
      data: {
        entityId: entity.id,
        code: d.code,
        nameHe: d.nameHe,
        isCharityFund: d.isCharityFund,
      },
    });
    divisions[d.code] = row.id;
  }

  const branches: Record<string, string> = {};
  for (const b of org.branches) {
    const row = await prisma.branch.create({
      data: { entityId: entity.id, code: b.code, nameHe: b.nameHe, city: b.city },
    });
    branches[b.code] = row.id;
  }

  await prisma.fund.createMany({
    data: org.funds.map((f) => ({
      entityId: entity.id,
      code: f.code,
      nameHe: f.nameHe,
      isRestricted: f.isRestricted,
    })),
  });

  const campaigns: Record<string, string> = {};
  for (const c of org.campaigns) {
    const row = await prisma.campaign.create({
      data: {
        entityId: entity.id,
        divisionId: c.division ? divisions[c.division] : undefined,
        nameHe: c.nameHe,
      },
    });
    campaigns[c.code] = row.id;
  }

  const projects: Record<string, string> = {};
  for (const p of org.projects) {
    const row = await prisma.project.create({
      data: {
        entityId: entity.id,
        divisionId: p.division ? divisions[p.division] : undefined,
        branchId: p.branch ? branches[p.branch] : undefined,
        code: p.code,
        nameHe: p.nameHe,
      },
    });
    projects[p.code] = row.id;
  }

  const users: Record<string, string> = {};
  for (const u of usersFile.users) {
    const user = await prisma.user.create({
      data: {
        entityId: entity.id,
        email: u.email,
        nameHe: u.nameHe,
        passwordHash,
        isDemo: true,
      },
    });
    users[u.email] = user.id;
    for (const role of u.roles) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: role.role as RoleCode,
          scopeType: role.scopeType as ScopeType,
          divisionId: role.division ? divisions[role.division] : undefined,
          scopeId: role.division ? divisions[role.division] : undefined,
        },
      });
    }
  }

  const contacts: Record<string, string> = {};
  for (const c of contactsFile.contacts) {
    const contact = await prisma.contact.create({
      data: {
        entityId: entity.id,
        kind: c.kind,
        displayName: c.displayName,
        firstName: c.firstName,
        lastName: c.lastName,
        organizationName: c.organizationName,
        nationalId: c.nationalId,
        city: c.city,
        branchId: c.branch ? branches[c.branch] : undefined,
        roles: { create: c.roles.map((role) => ({ role })) },
        channels: {
          create: c.channels.map((ch) => ({
            type: ch.type,
            value: ch.value,
            normalized: ch.normalized,
            isPrimary: ch.isPrimary ?? false,
          })),
        },
        addresses: c.addresses
          ? { create: c.addresses.map((a) => ({ line1: a.line1, city: a.city, isCurrent: true })) }
          : undefined,
        vendorAccount: c.businessId
          ? { create: { businessId: c.businessId, paymentTerms: c.paymentTerms } }
          : undefined,
      },
    });
    contacts[c.key] = contact.id;
  }

  for (const u of usersFile.users) {
    if (u.contactKey && contacts[u.contactKey]) {
      await prisma.user.update({
        where: { id: users[u.email] },
        data: { contactId: contacts[u.contactKey] },
      });
    }
  }

  for (const c of fundraising.commitments) {
    const commitment = await prisma.commitment.create({
      data: {
        entityId: entity.id,
        contactId: contacts[c.contactKey],
        campaignId: c.campaign ? campaigns[c.campaign] : undefined,
        amount: c.amount,
        currency: (c.currency ?? "ILS") as Currency,
        purpose: c.purpose,
        status: c.status,
        allocations: {
          create: c.allocations.map((a) => ({
            divisionId: divisions[a.division],
            amount: a.amount,
            currency: (c.currency ?? "ILS") as Currency,
          })),
        },
      },
    });
    if (c.donation) {
      const donation = c.donation;
      await prisma.donation.create({
        data: {
          entityId: entity.id,
          contactId: contacts[c.contactKey],
          commitmentId: commitment.id,
          amount: donation.amount,
          currency: (donation.currency ?? c.currency ?? "ILS") as Currency,
          collectedAt: new Date(),
          status: donation.status,
          source: donation.source,
          allocations: {
            create: (donation.allocations ?? c.allocations).map((a) => ({
              divisionId: divisions[a.division],
              amount: a.amount,
              currency: (donation.currency ?? c.currency ?? "ILS") as Currency,
            })),
          },
        },
      });
    }
  }

  for (const t of tasksFile.tasks) {
    await prisma.task.create({
      data: {
        entityId: entity.id,
        type: t.type,
        title: t.title,
        description: t.description,
        assigneeId: t.assigneeEmail ? users[t.assigneeEmail] : undefined,
        createdById: t.createdByEmail ? users[t.createdByEmail] : undefined,
        contactId: t.contactKey ? contacts[t.contactKey] : undefined,
        divisionId: t.division ? divisions[t.division] : undefined,
        campaignId: t.campaign ? campaigns[t.campaign] : undefined,
        amount: t.amount,
        dueAt: t.dueOffsetDays != null ? daysFromNow(t.dueOffsetDays) : undefined,
        priority: t.priority ?? 50,
      },
    });
  }

  const accounts: Record<string, string> = {};
  for (const a of banking.accounts) {
    const row = await prisma.bankAccount.create({
      data: {
        entityId: entity.id,
        labelHe: a.labelHe,
        bankCode: a.bankCode,
        bankNameHe: a.bankNameHe,
        branch: a.branch,
        account: a.account,
        accountType: a.accountType,
        currency: a.currency as Currency,
        currentBalance: null,
        openingBalance: null,
        balanceAsOf: null,
        lastSyncedAt: null,
      },
    });
    accounts[a.key] = row.id;
  }

  const ilsId = accounts.ils;
  await prisma.integrationConnection.create({
    data: {
      entityId: entity.id,
      provider: "FIBI",
      environment: "PRODUCTION",
      labelHe: "FIBI ייצור — עו״ש שקלים",
      status: "DRAFT",
      bankAccountId: ilsId,
      accessExists: false,
      dataRead: true,
      writeAllowed: false,
      capabilityVerified: false,
      config: { writeMode: "mock" },
    },
  });

  console.log("Seed complete: org, users, contacts. No fake bank movements or OAuth tokens.");
}

type OrgFile = {
  entity: { name: string; nameHe: string; taxId: string; crossDivisionDonorAxis: boolean };
  departments: { kind: "FUNDRAISING" | "TREASURY"; nameHe: string }[];
  divisions: { code: string; nameHe: string; isCharityFund: boolean }[];
  branches: { code: string; nameHe: string; city: string }[];
  funds: { code: string; nameHe: string; isRestricted: boolean }[];
  campaigns: { code: string; nameHe: string; division?: string }[];
  projects: { code: string; nameHe: string; division?: string; branch?: string }[];
};

type UsersFile = {
  password: string;
  users: {
    email: string;
    nameHe: string;
    showOnLogin: boolean;
    loginLabel?: string;
    specRef?: string;
    summaryHe?: string;
    contactKey?: string;
    roles: { role: string; scopeType: string; division?: string }[];
  }[];
};

type ContactsFile = {
  contacts: {
    key: string;
    kind: "PERSON" | "FAMILY" | "ORGANIZATION";
    displayName: string;
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    nationalId?: string;
    city?: string;
    branch?: string;
    roles: string[];
    businessId?: string;
    paymentTerms?: string;
    channels: { type: string; value: string; normalized?: string; isPrimary?: boolean }[];
    addresses?: { line1: string; city: string }[];
  }[];
};

type FundraisingFile = {
  commitments: {
    contactKey: string;
    campaign?: string;
    amount: string;
    currency?: string;
    purpose: string;
    status: "FUTURE" | "PENDING" | "FAILED" | "PARTIAL" | "COLLECTED" | "CANCELLED" | "REFUNDED";
    allocations: { division: string; amount: string }[];
    donation?: {
      amount: string;
      currency?: string;
      status: "PARTIAL" | "COLLECTED";
      source: string;
      allocations?: { division: string; amount: string }[];
    };
  }[];
};

type TasksFile = {
  tasks: {
    type:
      | "COLLECTION_REFUSAL"
      | "WAITING_BANK"
      | "LEAD"
      | "COMPLETION"
      | "GENERAL";
    title: string;
    description?: string;
    assigneeEmail?: string;
    createdByEmail?: string;
    contactKey?: string;
    division?: string;
    campaign?: string;
    amount?: string;
    dueOffsetDays?: number;
    priority?: number;
  }[];
};

type BankingFile = {
  accounts: {
    key: string;
    labelHe: string;
    bankCode: string;
    bankNameHe: string;
    branch: string;
    account: string;
    accountType: string;
    currency: string;
    openingBalance?: string | null;
    currentBalance?: string | null;
  }[];
  movements: {
    accountKey: string;
    externalId: string;
    transactionCounter: string;
    amount: string;
    currency: string;
    actionCode: string;
    actionType: string;
    description: string;
    openingBalance?: string;
    closingBalance?: string;
    contraBank?: string;
    contraBranch?: string;
    contraAccount?: string;
    beneficiaryName?: string;
    transactionReason?: string;
  }[];
  drafts: {
    accountKey: string;
    idempotencyKey: string;
    kind: "SINGLE";
    amount: string;
    category: string;
    beneficiaryName: string;
    bank: string;
    branch: string;
    account: string;
    comment?: string;
  }[];
  checks: {
    accountKey: string;
    number: string;
    payeeName: string;
    amount: string;
    valueOffsetDays: number;
    status: "READY";
  }[];
  paymentRequests: {
    number: string;
    title: string;
    status: string;
    amount: string;
    division?: string;
    project?: string;
    payeeKey?: string;
  }[];
};

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
