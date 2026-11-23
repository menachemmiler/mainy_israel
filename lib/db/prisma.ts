import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || process.env.NODE_ENV === "production") return url;
  let next = url.replace(/connection_limit=\d+/, "connection_limit=3");
  if (!next.includes("connection_limit=")) {
    next += `${next.includes("?") ? "&" : "?"}connection_limit=3`;
  }
  if (!next.includes("pool_timeout=")) {
    next += "&pool_timeout=30";
  }
  return next;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: datasourceUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
