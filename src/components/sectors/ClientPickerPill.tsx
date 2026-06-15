"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { fmtSar } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  UserCircle2,
  X,
  Search,
  AlertCircle,
  Check,
  Users,
} from "lucide-react";

type Client = { id: string; name: string; nameAr: string; aumSar: number };

export function ClientPickerPill({
  locale,
  clients,
  activeClientIds,
}: {
  locale: string;
  clients: Client[];
  activeClientIds: string[];
}) {
  const t = useTranslations("sectors");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const activeSet = new Set(activeClientIds);
  const active = clients.filter((c) => activeSet.has(c.id));
  const totalActiveAum = active.reduce((s, c) => s + c.aumSar, 0);

  function navigateWith(nextIds: string[]) {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    sp.delete("client"); // drop legacy single-param if present
    if (nextIds.length > 0) sp.set("clients", nextIds.join(","));
    else sp.delete("clients");
    const qs = sp.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function toggle(clientId: string) {
    const next = activeSet.has(clientId)
      ? activeClientIds.filter((id) => id !== clientId)
      : [...activeClientIds, clientId];
    navigateWith(next);
  }

  function clearAll() {
    navigateWith([]);
  }

  const filtered = q.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q.trim().toLowerCase()) ||
          c.nameAr.includes(q.trim()),
      )
    : clients;

  const hasAny = active.length > 0;
  const isMulti = active.length > 1;

  // Display name for the pill itself
  function pillContent() {
    if (!hasAny) {
      return (
        <>
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{t("pickClientsCTA")}</span>
        </>
      );
    }
    if (isMulti) {
      return (
        <>
          <Users className="w-4 h-4 text-madkhol-700" />
          <span className="text-xs text-muted">{t("activeClients")}:</span>
          <span className="font-medium">
            {t("clientCount", { n: active.length })}
          </span>
          <span className="text-xs text-ash-500 tabular">
            Σ {fmtSar(totalActiveAum)} SAR
          </span>
          <span className="text-xs text-madkhol-700 ms-1">
            {t("changeClients")}
          </span>
        </>
      );
    }
    const only = active[0];
    return (
      <>
        <UserCircle2 className="w-4 h-4 text-madkhol-700" />
        <span className="text-xs text-muted">{t("activeClient")}:</span>
        <span className="font-medium">
          {locale === "ar" ? only.nameAr : only.name}
        </span>
        <span className="text-xs text-ash-500 tabular">
          {fmtSar(only.aumSar)} SAR
        </span>
        <span className="text-xs text-madkhol-700 ms-1">
          {t("changeClient")}
        </span>
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition",
          hasAny
            ? "border-madkhol-300 bg-madkhol-50 text-deep"
            : "border-amber-300 bg-amber-50 text-amber-800",
        )}
      >
        {pillContent()}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute end-6 mt-2 w-[340px] card shadow-soft bg-white max-h-[70vh] overflow-hidden flex flex-col"
            style={{
              top: "calc(var(--topbar-height, 64px) + 80px)",
            }}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-ash-400" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("pickClients")}
                  className="input ps-9 py-2 text-sm"
                />
              </div>
              {hasAny ? (
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-muted">
                    {t("clientCount", { n: active.length })} ·{" "}
                    <span className="tabular">{fmtSar(totalActiveAum)} SAR</span>
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-madkhol-700 hover:underline font-medium"
                  >
                    {t("clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
            <ul className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">—</p>
              ) : (
                filtered.map((c) => {
                  const isActive = activeSet.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={cn(
                          "w-full text-start flex items-center gap-3 p-3 transition border-b border-border/60 last:border-0",
                          isActive ? "bg-madkhol-50" : "hover:bg-ash-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition",
                            isActive
                              ? "bg-madkhol-600 border-madkhol-600 text-white"
                              : "border-ash-300 bg-white",
                          )}
                        >
                          {isActive ? <Check className="w-3.5 h-3.5" /> : null}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-brand-gradient text-white grid place-items-center text-[10px] font-semibold shrink-0">
                          {(locale === "ar" ? c.nameAr : c.name)
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {locale === "ar" ? c.nameAr : c.name}
                          </p>
                          <p className="text-xs text-muted tabular">
                            {fmtSar(c.aumSar)} SAR
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="p-3 border-t border-border flex items-center justify-end gap-2 bg-ash-50/30">
              <button
                onClick={() => setOpen(false)}
                className="btn-gradient text-xs"
              >
                <X className="w-3.5 h-3.5" />
                {t("done")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
