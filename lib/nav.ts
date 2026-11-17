import type { DomainCode } from "@prisma/client";
import { can } from "@/lib/rbac/engine";
import type { AuthPrincipal } from "@/lib/rbac/types";

export type NavItem = {
  href: string;
  label: string;
  domain: DomainCode;
  children?: { href: string; label: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "בית", domain: "ORGANIZATION" },
  { href: "/tasks", label: "משימות", domain: "TASK" },
  {
    href: "/budget",
    label: "תקציב ופרויקטים",
    domain: "BUDGET",
    children: [
      { href: "/budget", label: "תקציב" },
      { href: "/projects", label: "פרויקטים" },
    ],
  },
  {
    href: "/fundraising",
    label: "גיוס ותורמים",
    domain: "DONOR",
    children: [
      { href: "/contacts", label: "אלפון" },
      { href: "/fundraising", label: "תורמים והתחייבויות" },
      { href: "/fundraising/recurring", label: "הוראות קבע" },
    ],
  },
  {
    href: "/payments",
    label: "בקשות ותשלומים",
    domain: "PAYMENT_REQUEST",
    children: [
      { href: "/payments", label: "בקשות" },
      { href: "/vendors", label: "ספקים" },
    ],
  },
  { href: "/payroll", label: "שכר וקבועים", domain: "PAYROLL" },
  {
    href: "/banking",
    label: "בנקים ותזרים",
    domain: "BANK",
    children: [
      { href: "/banking", label: "חשבונות ויתרות" },
      { href: "/banking/movements", label: "תנועות" },
      { href: "/banking/drafts", label: "טיוטות העברה" },
      { href: "/banking/checks", label: "צ׳קים" },
      { href: "/banking/cashflow", label: "תזרים" },
      { href: "/banking/connections", label: "חיבורי בנק" },
    ],
  },
  { href: "/communications", label: "תקשורת", domain: "COMMUNICATION" },
  { href: "/reports", label: "דוחות", domain: "REPORT" },
  { href: "/settings", label: "הגדרות", domain: "SETTINGS" },
];

export function navFor(principal: AuthPrincipal): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.href === "/") return true;
    if (item.domain === "SETTINGS") {
      return can(principal, "READ", "SETTINGS") || can(principal, "MANAGE_CONNECTION", "INTEGRATION");
    }
    return can(principal, "READ", item.domain);
  });
}
