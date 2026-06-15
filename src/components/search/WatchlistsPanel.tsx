"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  X,
  Star,
  Trash2,
  Plus,
  Edit3,
  Check,
  CircleAlert,
} from "lucide-react";
import {
  createWatchlist,
  deleteWatchlist,
  renameWatchlist,
} from "@/app/[locale]/(app)/search/actions";
import type { WatchlistSummary } from "@/lib/universal-search/watchlists";

export function WatchlistsPanel({
  watchlists,
  locale,
  onClose,
}: {
  watchlists: WatchlistSummary[];
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await createWatchlist({ name });
      setNewName("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function commitRename(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    setBusy(true);
    try {
      await renameWatchlist({ id, name });
      setRenaming(null);
      setRenameValue("");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function destroy(id: string) {
    if (!confirm(t("watchlistConfirmDelete"))) return;
    setBusy(true);
    try {
      await deleteWatchlist(id);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
              <Star className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t("watchlistsTitle")}</h2>
              <p className="text-xs text-muted">{t("watchlistsSubtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="card p-3 bg-cream/40 border-madkhol-100">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder={t("watchlistNamePlaceholder")}
                className="input flex-1"
              />
              <button
                onClick={create}
                disabled={busy || !newName.trim()}
                className="btn-gradient shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t("watchlistNew")}
              </button>
            </div>
          </div>

          {error ? (
            <div className="card p-3 bg-red-50 border-red-200 flex items-start gap-2 text-sm text-red-700">
              <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {watchlists.length === 0 ? (
            <p className="text-center text-sm text-muted py-8">
              {t("watchlistEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {watchlists.map((w) => (
                <li key={w.id} className="card p-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-madkhol-50 text-madkhol-700 grid place-items-center shrink-0">
                    <Star className="w-4 h-4 fill-current" />
                  </span>
                  {renaming === w.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && commitRename(w.id)
                      }
                      className="input py-1.5 flex-1"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {locale === "ar" && w.nameAr ? w.nameAr : w.name}
                      </p>
                      <p className="text-xs text-muted">
                        {t("watchlistItemCount", { n: w.itemCount })}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {renaming === w.id ? (
                      <button
                        onClick={() => commitRename(w.id)}
                        disabled={busy}
                        className={cn(
                          "p-1.5 rounded-md text-madkhol-700 hover:bg-madkhol-50",
                        )}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRenaming(w.id);
                          setRenameValue(w.name);
                        }}
                        className="p-1.5 rounded-md text-ash-500 hover:text-deep hover:bg-ash-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => destroy(w.id)}
                      disabled={busy}
                      className="p-1.5 rounded-md text-ash-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
