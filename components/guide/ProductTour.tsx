"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { buildSpotlightSteps, TOUR_STEPS, TOUR_STORAGE_KEY } from "@/lib/spec-guide";

type Rect = { top: number; left: number; width: number; height: number };

export function ProductTour({
  open,
  onClose,
  onExpandNav,
  onSpotlight,
}: {
  open: boolean;
  onClose: () => void;
  onExpandNav?: (parentHref: string | null) => void;
  onSpotlight?: (active: boolean) => void;
}) {
  const spots = useMemo(() => buildSpotlightSteps(), []);
  const [phase, setPhase] = useState<"intro" | "spots">("intro");
  const [introStep, setIntroStep] = useState(0);
  const [spotStep, setSpotStep] = useState(0);
  const [target, setTarget] = useState<Rect | null>(null);

  const spot = spots[spotStep];

  const measure = useCallback(() => {
    if (phase !== "spots" || !spot) {
      setTarget(null);
      return;
    }
    const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${spot.tourId}"]`);
    const el = Array.from(nodes).find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
    if (!el) {
      setTarget(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const r = el.getBoundingClientRect();
    setTarget({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [phase, spot]);

  useEffect(() => {
    if (open) {
      setPhase("intro");
      setIntroStep(0);
      setSpotStep(0);
      onExpandNav?.(null);
      onSpotlight?.(false);
    }
  }, [open, onExpandNav, onSpotlight]);

  useEffect(() => {
    if (!open || phase !== "spots") {
      onExpandNav?.(null);
      onSpotlight?.(false);
      return;
    }
    onSpotlight?.(true);
    onExpandNav?.(spot?.parentHref ?? null);
  }, [open, phase, spot, onExpandNav, onSpotlight]);

  useLayoutEffect(() => {
    if (!open || phase !== "spots") return;
    const t1 = window.setTimeout(measure, 40);
    const t2 = window.setTimeout(measure, 200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, phase, spotStep, measure]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onResize() {
      measure();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, onClose, measure]);

  if (!open) return null;

  if (phase === "intro") {
    const current = TOUR_STEPS[introStep];
    const last = introStep === TOUR_STEPS.length - 1;
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <div className="max-h-[min(92vh,820px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[var(--brand)]">{current.spec}</p>
              <h2 id="tour-title" className="text-xl font-semibold">
                {current.title}
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="סגור הדרכה" className="rounded-lg p-1 hover:bg-[var(--bg)]">
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[min(62vh,560px)] overflow-y-auto px-5 py-4">
            <p className="text-sm leading-6 text-[var(--ink)]">{current.body}</p>
            {current.bullets && (
              <ul className="mt-3 list-disc space-y-1 pr-5 text-sm text-[var(--muted)]">
                {current.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3">
            <span className="text-xs text-[var(--muted)]">
              {introStep + 1} מתוך {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {introStep > 0 && (
                <button
                  type="button"
                  className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                  onClick={() => setIntroStep((s) => s - 1)}
                >
                  הקודם
                </button>
              )}
              <button type="button" className="rounded-xl px-3 py-2 text-sm text-[var(--muted)]" onClick={onClose}>
                דלג
              </button>
              <button
                type="button"
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm text-white"
                onClick={() => {
                  if (last) {
                    setPhase("spots");
                    setSpotStep(0);
                  } else {
                    setIntroStep((s) => s + 1);
                  }
                }}
              >
                {last ? "המשך לסיור בתפריט" : "הבא"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lastSpot = spotStep === spots.length - 1;
  const bubble = placeBubble(target);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-spot-title">
      {!target && <div className="absolute inset-0 bg-black/45" onClick={onClose} />}
      {target && (
        <>
          <div className="absolute inset-0" onClick={onClose} />
          <div
            className="tour-spot pointer-events-none absolute rounded-xl"
            style={{
              top: target.top - 6,
              left: target.left - 6,
              width: target.width + 12,
              height: target.height + 12,
            }}
          />
        </>
      )}
      <div
        className="absolute z-[82] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 shadow-2xl"
        style={{ top: bubble.top, left: bubble.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[var(--brand)]">{spot.spec}</p>
            <h2 id="tour-spot-title" className="text-lg font-semibold">
              {spot.label}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="סגור הדרכה" className="rounded-lg p-1 hover:bg-[var(--bg)]">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">{spot.does}</p>
        {!target && <p className="mt-2 text-xs text-[var(--warn)]">הלחצן בתפריט הימני — גללו אם אינו נראה.</p>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--muted)]">
            {spotStep + 1} מתוך {spots.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm"
              onClick={() => {
                if (spotStep === 0) {
                  setPhase("intro");
                  setIntroStep(TOUR_STEPS.length - 1);
                  onExpandNav?.(null);
                } else {
                  setSpotStep((s) => s - 1);
                }
              }}
            >
              הקודם
            </button>
            <button type="button" className="rounded-xl px-3 py-1.5 text-sm text-[var(--muted)]" onClick={onClose}>
              דלג
            </button>
            <button
              type="button"
              className="rounded-xl bg-[var(--brand)] px-3 py-1.5 text-sm text-white"
              onClick={() => {
                if (lastSpot) onClose();
                else setSpotStep((s) => s + 1);
              }}
            >
              {lastSpot ? "סיום" : "הבא"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function placeBubble(target: Rect | null) {
  const width = Math.min(352, typeof window === "undefined" ? 352 : window.innerWidth - 24);
  const height = 240;
  if (!target) {
    return { top: 80, left: 16 };
  }
  const gap = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const inHeader = target.top < 80;
  let left: number;
  let top: number;
  if (inHeader) {
    top = target.top + target.height + gap;
    left = Math.max(12, Math.min(target.left, vw - width - 12));
  } else {
    left = target.left - width - gap;
    if (left < 12) left = Math.min(target.left + target.width + gap, vw - width - 12);
    left = Math.max(12, Math.min(left, vw - width - 12));
    top = target.top;
  }
  if (top + height > vh - 12) top = Math.max(12, vh - height - 12);
  if (top < 12) top = 12;
  return { top, left };
}

export function markTourSeen() {
  try {
    sessionStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function shouldAutoOpenTour() {
  try {
    return sessionStorage.getItem(TOUR_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}
