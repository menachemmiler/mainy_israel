"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { clsx } from "clsx";
import type { NavItem } from "@/lib/nav";

type Me = {
  user: { nameHe: string; email: string; roles: { code: string; labelHe: string }[] };
  nav: NavItem[];
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; subtitle?: string; href: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const nav = me?.nav ?? [];
  const active = useMemo(() => {
    return nav.find((item) => item.href !== "/" && pathname.startsWith(item.href)) ?? nav[0];
  }, [nav, pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg-elev)]/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="תפריט">
              <Menu size={22} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 text-[var(--muted)]" size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חיפוש שם, טלפון, בקשה או אסמכתא"
                className="w-full rounded-xl border border-[var(--line)] bg-white py-2 pr-9 pl-3 text-sm"
              />
              {results.length > 0 && (
                <div className="absolute mt-1 w-full rounded-xl border border-[var(--line)] bg-white shadow-lg">
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      className="block px-3 py-2 text-sm hover:bg-[var(--bg)]"
                      onClick={() => setResults([])}
                    >
                      <div>{r.title}</div>
                      {r.subtitle && <div className="text-xs text-[var(--muted)]">{r.subtitle}</div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden text-sm text-[var(--muted)] sm:block">
              {me?.user.nameHe ?? <span className="skeleton inline-block h-4 w-24 rounded-full align-middle" />}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      <aside className="hidden border-s border-[var(--line)] bg-[var(--brand)] text-white lg:flex lg:flex-col">
        <div className="p-5">
          <div className="text-lg font-semibold">מעייני ישראל</div>
          <div className="text-xs text-white/70">גזברות · גרסה 1</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {!me &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-on-brand h-9 rounded-xl" />
            ))}
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "block rounded-xl px-3 py-2 text-sm",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-white text-[var(--brand)]"
                    : "text-white/90 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
              {item.children && active?.href === item.href && (
                <div className="mb-2 mr-3 mt-1 space-y-1 border-r border-white/20 pr-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={clsx(
                        "block rounded-lg px-2 py-1 text-xs",
                        pathname === child.href ? "bg-white/20" : "text-white/70 hover:text-white",
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4">
          <button
            className="text-xs text-white/70 underline"
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            יציאה
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-72 bg-[var(--brand)] p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mb-4" onClick={() => setOpen(false)} aria-label="סגור">
              <X />
            </button>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block py-2" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
