"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { StickyNote, Trash2, Save } from "lucide-react";
import { upsertAssetNote, deleteAssetNote } from "@/app/[locale]/(app)/search/actions";

const POPOVER_WIDTH = 320; // w-80

export function NoteButton({
  symbol,
  initialBody,
  initialUpdatedAt,
}: {
  symbol: string;
  initialBody?: string;
  initialUpdatedAt?: string;
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
  const [body, setBody] = useState(initialBody ?? "");
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  function openPopover() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const desiredRight = rect.right;
      const left = Math.max(8, Math.min(viewportW - POPOVER_WIDTH - 8, desiredRight - POPOVER_WIDTH));
      setPopoverPos({ top: rect.bottom + 4, left });
    }
    setOpen(true);
  }

  const hasNote = (initialBody ?? "").trim().length > 0;

  useEffect(() => {
    if (open) taRef.current?.focus();
  }, [open]);

  async function save() {
    setBusy(true);
    try {
      await upsertAssetNote({ symbol, body });
      setOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t("noteConfirmDelete"))) return;
    setBusy(true);
    try {
      await deleteAssetNote(symbol);
      setBody("");
      setOpen(false);
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
          "p-1 rounded-md transition relative",
          hasNote
            ? "text-madkhol-700 hover:text-madkhol-800"
            : "text-ash-300 hover:text-deep",
        )}
        aria-label={hasNote ? t("noteEdit") : t("noteAdd")}
        title={hasNote ? initialBody : undefined}
      >
        <StickyNote
          className={cn("w-4 h-4", hasNote && "fill-madkhol-50")}
        />
        {hasNote ? (
          <span className="absolute -top-0.5 -end-0.5 w-1.5 h-1.5 rounded-full bg-madkhol-600" />
        ) : null}
      </button>

      {open && popoverPos ? (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-[101] w-80 card shadow-soft bg-white overflow-hidden"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {hasNote ? t("noteEdit") : t("noteAdd")} · {symbol}
              </p>
              {initialUpdatedAt ? (
                <span className="text-[10px] text-muted">
                  {new Date(initialUpdatedAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
            <div className="p-3">
              <textarea
                ref={taRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("notePlaceholder")}
                rows={4}
                maxLength={1000}
                className="input resize-none text-sm"
              />
              <p className="text-[10px] text-muted mt-1 text-end tabular">
                {body.length} / 1000
              </p>
            </div>
            <div className="px-3 py-2 border-t border-border flex items-center justify-between gap-2 bg-ash-50/30">
              {hasNote ? (
                <button
                  onClick={remove}
                  disabled={busy}
                  className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("noteDelete")}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={save}
                disabled={busy}
                className="btn-gradient text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {busy ? t("noteSaving") : t("noteSave")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
