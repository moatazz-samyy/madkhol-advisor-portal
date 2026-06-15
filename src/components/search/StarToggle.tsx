"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Star, Plus, Check } from "lucide-react";
import {
  createWatchlist,
  toggleWatchlistItem,
} from "@/app/[locale]/(app)/search/actions";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";

const POPOVER_WIDTH = 256; // w-64

export function StarToggle({
  symbol,
  watchlists,
  membership,
  locale,
}: {
  symbol: string;
  watchlists: WatchlistSummary[];
  membership: string[]; // watchlist IDs this symbol belongs to
  locale: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [optimistic, setOptimistic] = useState<Set<string>>(
    new Set(membership),
  );
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const isStarred = optimistic.size > 0;

  function openPopover() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Right-align with the button when there's room, else push left so the
      // popover stays within the viewport. Sit just below the icon.
      const viewportW = window.innerWidth;
      const desiredRight = rect.right;
      const left = Math.max(8, Math.min(viewportW - POPOVER_WIDTH - 8, desiredRight - POPOVER_WIDTH));
      setPopoverPos({ top: rect.bottom + 4, left });
    }
    setOpen(true);
  }

  async function toggleList(watchlistId: string) {
    // Optimistic local flip so the icon feels instant
    setOptimistic((cur) => {
      const next = new Set(cur);
      if (next.has(watchlistId)) next.delete(watchlistId);
      else next.add(watchlistId);
      return next;
    });
    setBusy(true);
    try {
      await toggleWatchlistItem({ watchlistId, symbol });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const { id } = await createWatchlist({ name });
      await toggleWatchlistItem({ watchlistId: id, symbol });
      setOptimistic((cur) => new Set(cur).add(id));
      setNewName("");
      setCreating(false);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openPopover();
        }}
        className={cn(
          "p-1 rounded-md transition",
          isStarred
            ? "text-amber-500 hover:text-amber-600"
            : "text-ash-300 hover:text-amber-500",
        )}
        aria-label={t("watchlistAddTo")}
      >
        <Star
          className={cn("w-4 h-4", isStarred && "fill-current")}
        />
      </button>

      {open && popoverPos ? (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-[101] w-64 card shadow-soft bg-white overflow-hidden"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t("watchlistAddTo")}
              </p>
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {watchlists.length === 0 ? (
                <li className="px-3 py-4 text-xs text-muted text-center">
                  {t("watchlistEmpty")}
                </li>
              ) : (
                watchlists.map((w) => {
                  const active = optimistic.has(w.id);
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => toggleList(w.id)}
                        disabled={busy}
                        className={cn(
                          "w-full text-start flex items-center gap-2 px-3 py-2 text-sm transition",
                          active ? "bg-madkhol-50" : "hover:bg-ash-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded border-2 grid place-items-center shrink-0",
                            active
                              ? "bg-madkhol-600 border-madkhol-600 text-white"
                              : "border-ash-300 bg-white",
                          )}
                        >
                          {active ? <Check className="w-3 h-3" /> : null}
                        </span>
                        <span className="flex-1 truncate">
                          {locale === "ar" && w.nameAr ? w.nameAr : w.name}
                        </span>
                        <span className="text-[10px] text-muted tabular shrink-0">
                          {w.itemCount}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            {creating ? (
              <div className="p-2 border-t border-border bg-ash-50/40">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                  placeholder={t("watchlistNamePlaceholder")}
                  className="input py-1.5 text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                    className="btn-ghost text-xs flex-1"
                  >
                    {t("watchlistCancel")}
                  </button>
                  <button
                    onClick={createAndAdd}
                    disabled={busy || !newName.trim()}
                    className="btn-gradient text-xs flex-1"
                  >
                    {t("watchlistCreateAdd")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full p-2 border-t border-border text-sm text-madkhol-700 hover:bg-madkhol-50/40 inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("watchlistNew")}
              </button>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
