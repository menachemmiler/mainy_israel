"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { CircleHelp, Menu, Search, X } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { SpecNote } from "@/components/guide/SpecNote";
import { markTourSeen, ProductTour, shouldAutoOpenTour } from "@/components/guide/ProductTour";

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
  const [tourOpen, setTourOpen] = useState(false);
  const [tourExpandHref, setTourExpandHref] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Me) => {
        setMe(data);
        if (shouldAutoOpenTour()) setTourOpen(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const closeTour = useCallback(() => {
    markTourSeen();
    setTourOpen(false);
    setTourExpandHref(null);
  }, []);

  const expandTourNav = useCallback((href: string | null) => {
    setTourExpandHref(href);
  }, []);

  const setSpotlight = useCallback((active: boolean) => {
    if (active) setOpen(true);
  }, []);

  const roleLabel = me?.user.roles.map((r) => r.labelHe).join(" · ");

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
  const menu = tourOpen ? NAV_ITEMS : nav;
  const active = useMemo(() => {
    return menu.find((item) => item.href !== "/" && pathname.startsWith(item.href)) ?? menu[0];
  }, [menu, pathname]);
  const showChildren = (item: NavItem) =>
    Boolean(item.children) && (active?.href === item.href || tourExpandHref === item.href);

  function guardTourNav(e: MouseEvent) {
    if (tourOpen) e.preventDefault();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg-elev)]/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="תפריט">
              <Menu size={22} />
            </button>
            <div className="relative flex-1" data-tour="search">
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
            <button
              type="button"
              data-tour="help"
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] px-2.5 py-1.5 text-xs text-[var(--brand)]"
              onClick={() => setTourOpen(true)}
              aria-label="הדרכה לפי האפיון"
            >
              <CircleHelp size={16} />
              <span className="hidden sm:inline">הדרכה</span>
            </button>
            <div className="hidden text-sm text-[var(--muted)] sm:block">
              {me ? (
                <div className="text-left">
                  <div className="text-[var(--ink)]">{me.user.nameHe}</div>
                  <div className="text-xs">{roleLabel}</div>
                </div>
              ) : (
                <span className="skeleton inline-block h-4 w-24 rounded-full align-middle" />
              )}
            </div>
          </div>
        </header>
        <div className="border-b border-[var(--brand-2)]/40 bg-[color-mix(in_srgb,var(--brand-2)_18%,white)] px-4 py-2 text-xs text-[var(--ink)]">
          סביבת הדגמה לפי האפיון · נתוני דמה · הבנק עדיין לא מחובר · שידור לבנק במצב mock
        </div>
        <main className="flex-1 p-4 lg:p-6">
          <SpecNote pathname={pathname} />
          {children}
        </main>
      </div>

      <aside className="hidden border-s border-[var(--line)] bg-[var(--brand)] text-white lg:flex lg:flex-col">
        <div className="p-5">
          <div className="text-lg font-semibold">מעייני ישראל</div>
          <div className="text-xs text-white/70">גזברות · גרסה 1</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {!me &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-on-brand h-9 rounded-xl" />
            ))}
          {menu.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                data-tour={`nav-parent-${item.href}`}
                onClick={guardTourNav}
                className={clsx(
                  "block rounded-xl px-3 py-2 text-sm",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-white text-[var(--brand)]"
                    : "text-white/90 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
              {showChildren(item) && (
                <div className="mb-2 mr-3 mt-1 space-y-1 border-r border-white/20 pr-3">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      data-tour={`nav-child-${child.href}`}
                      onClick={guardTourNav}
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
        <div className="space-y-2 p-4">
          <button
            className="block text-xs text-white/80 underline"
            type="button"
            onClick={() => setTourOpen(true)}
          >
            הדרכה: מה כל לחצן עושה
          </button>
          <button
            className="text-xs text-white/70 underline"
            type="button"
            data-tour="logout"
            onClick={async () => {
              if (tourOpen) return;
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            יציאה והחלפת הרשאה
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
            {menu.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  data-tour={`nav-parent-${item.href}`}
                  className="block py-2"
                  onClick={(e) => {
                    if (tourOpen) {
                      e.preventDefault();
                      return;
                    }
                    setOpen(false);
                  }}
                >
                  {item.label}
                </Link>
                {showChildren(item) &&
                  item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      data-tour={`nav-child-${child.href}`}
                      className="block py-1 pr-3 text-sm text-white/80"
                      onClick={(e) => {
                        if (tourOpen) {
                          e.preventDefault();
                          return;
                        }
                        setOpen(false);
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
              </div>
            ))}
            <button className="mt-4 block py-2 text-sm text-white/80" type="button" onClick={() => { setOpen(false); setTourOpen(true); }}>
              הדרכה לפי האפיון
            </button>
            <button
              className="block py-2 text-sm text-white/70"
              type="button"
              data-tour="logout"
              onClick={async () => {
                if (tourOpen) return;
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
            >
              יציאה והחלפת הרשאה
            </button>
          </div>
        </div>
      )}

      <ProductTour
        open={tourOpen}
        onClose={closeTour}
        onExpandNav={expandTourNav}
        onSpotlight={setSpotlight}
      />
    </div>
  );
}
