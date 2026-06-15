"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldX,
  Zap,
  Briefcase,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import type { SectorDetail, AllocationMethod } from "@/lib/sectors/types";
import type { Asset } from "@/lib/universal-search/types";
import { ClientPickerPill } from "./ClientPickerPill";
import { executeBasketBuy } from "@/app/[locale]/(app)/sectors/actions";

const USD_TO_SAR = 3.75;

type Client = { id: string; name: string; nameAr: string; aumSar: number };

type Tab = "movers" | "gainers" | "all";

export function SectorDetailView({
  locale,
  detail,
  clients,
  activeClientIds,
}: {
  locale: string;
  detail: SectorDetail;
  clients: Client[];
  activeClientIds: string[];
}) {
  const activeClients = clients.filter((c) => activeClientIds.includes(c.id));
  const hasClient = activeClients.length > 0;
  const clientsQuery = activeClientIds.length > 0
    ? `?clients=${activeClientIds.join(",")}`
    : "";
  const t = useTranslations("sectors");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("movers");
  const [shariahOnly, setShariahOnly] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(50_000);
  const [method, setMethod] = useState<AllocationMethod>("equal");
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

  const [confirming, setConfirming] = useState<"selected" | "one_click" | null>(null);
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState<{
    tradeCount: number;
    totalSpentSar: number;
    clientCount: number;
    failedClients: string[];
  } | null>(null);
  const [, startTransition] = useTransition();

  const compliantStocks = detail.stocks.filter((s) => s.shariahCompliant);
  const nonCompliantInSector = detail.stocks.length - compliantStocks.length;

  const visibleStocks = useMemo(() => {
    return shariahOnly ? compliantStocks : detail.stocks;
  }, [shariahOnly, detail.stocks, compliantStocks]);

  const sortedStocks = useMemo(() => {
    const list = [...visibleStocks];
    if (tab === "movers") {
      list.sort((a, b) => Math.abs(b.priceChangePct) - Math.abs(a.priceChangePct));
      return list.slice(0, 10);
    }
    if (tab === "gainers") {
      list.sort((a, b) => b.ytdReturn - a.ytdReturn);
      return list.slice(0, 10);
    }
    return list.sort((a, b) => b.marketCapUsd - a.marketCapUsd);
  }, [tab, visibleStocks]);

  function toggle(symbol: string) {
    const next = new Set(selected);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    setSelected(next);
  }

  function selectAllCompliant() {
    // "Select all" excludes non-Shariah per spec
    const next = new Set(selected);
    for (const s of sortedStocks) if (s.shariahCompliant) next.add(s.symbol);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // Determine which stocks the buy will actually hit
  const basketSymbols =
    confirming === "one_click"
      ? compliantStocks.map((s) => s.symbol)
      : Array.from(selected).filter((sym) => {
          const a = detail.stocks.find((s) => s.symbol === sym);
          return a?.shariahCompliant;
        });

  const basketStocks = basketSymbols
    .map((sym) => detail.stocks.find((s) => s.symbol === sym))
    .filter((s): s is Asset => Boolean(s));

  // Compute per-stock amounts based on the selected allocation method
  const basket = useMemo(() => {
    if (basketStocks.length === 0 || amount <= 0) return [];
    if (method === "equal") {
      const per = Math.round(amount / basketStocks.length);
      return basketStocks.map((s) => ({ stock: s, amountSar: per }));
    }
    if (method === "cap_weighted") {
      const totalCap = basketStocks.reduce((s, a) => s + a.marketCapUsd, 0);
      return basketStocks.map((s) => ({
        stock: s,
        amountSar: Math.round((amount * s.marketCapUsd) / Math.max(totalCap, 1)),
      }));
    }
    // custom
    const total = Object.values(customWeights).reduce((s, v) => s + v, 0) || 1;
    return basketStocks.map((s) => ({
      stock: s,
      amountSar: Math.round(((customWeights[s.symbol] ?? 0) / total) * amount),
    }));
  }, [basketStocks, method, amount, customWeights]);

  const estimatedTotal = basket.reduce((s, b) => s + b.amountSar, 0);

  async function confirmBuy() {
    if (activeClientIds.length === 0) return;
    setExecuting(true);
    try {
      // Replicate the basket across every selected client. Each runs as its own
      // server action so a single bad client doesn't roll back the rest.
      const results = await Promise.allSettled(
        activeClientIds.map((clientId) =>
          executeBasketBuy(
            clientId,
            basket.map((b) => ({ symbol: b.stock.symbol, amountSar: b.amountSar })),
            {
              sector: detail.key,
              allocationMethod: method,
              sourceLabel:
                confirming === "one_click" ? "one_click_sector_buy" : "buy_selected",
            },
          ),
        ),
      );

      let tradeCount = 0;
      let totalSpentSar = 0;
      const failedClients: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          tradeCount += r.value.tradeCount;
          totalSpentSar += r.value.totalSpentSar;
        } else {
          const c = clients.find((x) => x.id === activeClientIds[i]);
          failedClients.push(c ? (locale === "ar" ? c.nameAr : c.name) : activeClientIds[i]);
        }
      });

      setSuccess({
        tradeCount,
        totalSpentSar,
        clientCount: results.filter((r) => r.status === "fulfilled").length,
        failedClients,
      });
      setConfirming(null);
      startTransition(() => router.refresh());
    } finally {
      setExecuting(false);
    }
  }

  const baseHref = `/${locale}/sectors`;
  const sectorTone = detail.summary.todayChangePct >= 0 ? "positive" : "negative";

  if (success) {
    const onlyClient = activeClientIds.length === 1 ? activeClientIds[0] : null;
    return (
      <div className="space-y-6">
        <Link
          href={`${baseHref}${clientsQuery}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-deep"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          {t("title")}
        </Link>
        <div className="card p-12 text-center bg-brand-soft border-madkhol-200">
          <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center text-madkhol-700 shadow-card mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("successTitle")}</h2>
          <p className="text-muted mb-6">
            {success.clientCount > 1
              ? t("successMessageMulti", {
                  n: success.tradeCount,
                  c: success.clientCount,
                  sar: fmtSar(success.totalSpentSar),
                })
              : t("successMessage", {
                  n: success.tradeCount,
                  sar: fmtSar(success.totalSpentSar),
                })}
          </p>
          {success.failedClients.length > 0 ? (
            <p className="text-xs text-red-700 mb-4">
              {t("successFailedClients", {
                names: success.failedClients.join(", "),
              })}
            </p>
          ) : null}
          <div className="flex items-center gap-2 justify-center">
            {onlyClient ? (
              <Link
                href={`/${locale}/clients/${onlyClient}`}
                className="btn-outline"
              >
                <Briefcase className="w-4 h-4" />
                {t("viewClient")}
              </Link>
            ) : success.clientCount > 1 ? (
              <Link href={`/${locale}/clients`} className="btn-outline">
                <Briefcase className="w-4 h-4" />
                {t("viewClients")}
              </Link>
            ) : null}
            <button
              onClick={() => {
                setSuccess(null);
                setSelected(new Set());
              }}
              className="btn-gradient"
            >
              <Sparkles className="w-4 h-4" />
              {t("newBasket")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Breadcrumb + client pill */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`${baseHref}${clientsQuery}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-deep"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          {t("title")}
        </Link>
        <ClientPickerPill
          locale={locale}
          clients={clients}
          activeClientIds={activeClientIds}
        />
      </div>

      {/* Sector hero */}
      <div
        className={cn(
          "card p-6 overflow-hidden relative",
          sectorTone === "positive" && "bg-madkhol-50/50 border-madkhol-200",
          sectorTone === "negative" && "bg-red-50/50 border-red-200",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted">
              GICS
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {locale === "ar" ? detail.labelAr : detail.labelEn}
            </h1>
          </div>
          <div className="flex gap-6 text-end">
            <div>
              <p className="text-xs uppercase text-muted">{t("todayChange")}</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular",
                  detail.summary.todayChangePct >= 0
                    ? "text-madkhol-700"
                    : "text-red-700",
                )}
              >
                {detail.summary.todayChangePct >= 0 ? "+" : ""}
                {detail.summary.todayChangePct.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">{t("ytd")}</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular",
                  detail.summary.ytdReturnPct >= 0
                    ? "text-madkhol-700"
                    : "text-red-700",
                )}
              >
                {detail.summary.ytdReturnPct >= 0 ? "+" : ""}
                {detail.summary.ytdReturnPct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">{t("stocks")}</p>
              <p className="text-2xl font-semibold tabular">
                {detail.summary.stockCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Shariah toggle */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="inline-flex bg-ash-100 rounded-xl p-1">
            <TabBtn active={tab === "movers"} onClick={() => setTab("movers")}>
              {t("tabMovers")}
            </TabBtn>
            <TabBtn active={tab === "gainers"} onClick={() => setTab("gainers")}>
              {t("tabGainers")}
            </TabBtn>
            <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
              {t("tabAll")}
            </TabBtn>
          </div>
          <div className="ms-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShariahOnly((s) => !s)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition border",
                shariahOnly
                  ? "border-madkhol-300 bg-madkhol-50 text-madkhol-700"
                  : "border-border bg-white text-ash-600",
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("shariahOnly")}
            </button>
            {sortedStocks.length > 0 ? (
              <>
                <button
                  onClick={selectAllCompliant}
                  className="btn-ghost text-xs"
                >
                  {t("selectAll")}
                </button>
                <button onClick={clearSelection} className="btn-ghost text-xs">
                  {t("clearAll")}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {sortedStocks.length === 0 ? (
          <p className="py-14 text-center text-muted text-sm">{t("noStocks")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th>{t("colSymbol")}</th>
                  <th>{t("colName")}</th>
                  <th className="text-end">{t("colPrice")}</th>
                  <th className="text-end">{t("colChange")}</th>
                  <th className="text-end">{t("colYtd")}</th>
                  <th className="text-end">{t("colCap")}</th>
                  <th>{t("colShariah")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((s) => {
                  const isSelected = selected.has(s.symbol);
                  const canSelect = s.shariahCompliant;
                  return (
                    <tr
                      key={s.symbol}
                      className={cn(
                        "transition",
                        isSelected && "bg-madkhol-50/40",
                        !canSelect && "opacity-75",
                      )}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={() => toggle(s.symbol)}
                          className="w-4 h-4 accent-madkhol-600 disabled:opacity-30"
                          aria-label={`Select ${s.symbol}`}
                        />
                      </td>
                      <td>
                        <span className="font-mono font-semibold text-deep">
                          {s.symbol}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm font-medium leading-tight">
                          {locale === "ar" ? s.nameAr : s.nameEn}
                        </p>
                      </td>
                      <td className="text-end tabular text-sm font-medium">
                        ${s.lastPrice.toFixed(2)}
                      </td>
                      <td className="text-end">
                        <ChangePill value={s.priceChangePct} />
                      </td>
                      <td className="text-end">
                        <span
                          className={cn(
                            "text-sm font-medium tabular",
                            s.ytdReturn >= 0
                              ? "text-madkhol-700"
                              : "text-red-600",
                          )}
                        >
                          {s.ytdReturn >= 0 ? "+" : ""}
                          {s.ytdReturn.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-end tabular text-sm">
                        ${formatCap(s.marketCapUsd)}B
                      </td>
                      <td>
                        {s.shariahCompliant ? (
                          <span className="badge-success">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="badge-danger">
                            <ShieldX className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky basket bar */}
      <BasketBar
        amount={amount}
        setAmount={setAmount}
        method={method}
        setMethod={setMethod}
        selectedCount={selected.size}
        estimatedTotal={estimatedTotal}
        hasClient={hasClient}
        clientCount={activeClientIds.length}
        compliantInSector={compliantStocks.length}
        nonCompliantInSector={nonCompliantInSector}
        onBuySelected={() => setConfirming("selected")}
        onOneClickSector={() => setConfirming("one_click")}
        locale={locale}
      />

      {/* Confirmation modal */}
      {confirming ? (
        <ConfirmModal
          locale={locale}
          basket={basket}
          totalSar={estimatedTotal}
          method={method}
          onCustomChange={(symbol, v) =>
            setCustomWeights((w) => ({ ...w, [symbol]: v }))
          }
          customWeights={customWeights}
          executing={executing}
          onClose={() => setConfirming(null)}
          onConfirm={confirmBuy}
        />
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Building blocks
// -----------------------------------------------------------------------------

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg transition",
        active ? "bg-white text-deep shadow-card" : "text-ash-600 hover:text-deep",
      )}
    >
      {children}
    </button>
  );
}

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  const Trend = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md tabular",
        positive ? "bg-madkhol-50 text-madkhol-700" : "bg-red-50 text-red-700",
      )}
    >
      <Trend className="w-3 h-3" />
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function formatCap(usdB: number): string {
  if (usdB >= 1000) return `${(usdB / 1000).toFixed(2)}T`;
  if (usdB >= 1) return usdB.toFixed(1);
  return usdB.toFixed(2);
}

// -----------------------------------------------------------------------------
// Basket bar
// -----------------------------------------------------------------------------

function BasketBar({
  amount,
  setAmount,
  method,
  setMethod,
  selectedCount,
  estimatedTotal,
  hasClient,
  clientCount,
  compliantInSector,
  nonCompliantInSector,
  onBuySelected,
  onOneClickSector,
  locale,
}: {
  amount: number;
  setAmount: (v: number) => void;
  method: AllocationMethod;
  setMethod: (m: AllocationMethod) => void;
  selectedCount: number;
  estimatedTotal: number;
  hasClient: boolean;
  clientCount: number;
  compliantInSector: number;
  nonCompliantInSector: number;
  onBuySelected: () => void;
  onOneClickSector: () => void;
  locale: string;
}) {
  const grandTotal = estimatedTotal * Math.max(clientCount, 1);
  const t = useTranslations("sectors");
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="container mx-auto px-6 pb-4">
        <div className="pointer-events-auto card p-3.5 shadow-soft bg-white max-w-5xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                {t("selectedCount", { n: selectedCount })}
              </p>
              <p className="text-sm font-semibold tabular">
                ≈ {fmtSar(estimatedTotal)}{" "}
                <span className="text-xs text-muted font-normal">SAR</span>
                {clientCount > 1 ? (
                  <span className="text-xs text-muted font-normal ms-1">
                    × {clientCount} = {fmtSar(grandTotal)} SAR
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="label !mb-0 !text-[10px]">
                {t("investmentAmount")}
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input w-28 py-1.5 text-sm tabular text-end"
                dir="ltr"
              />
            </div>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as AllocationMethod)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="equal">{t("allocation_equal")}</option>
              <option value="cap_weighted">{t("allocation_cap_weighted")}</option>
              <option value="custom">{t("allocation_custom")}</option>
            </select>

            <button
              onClick={onBuySelected}
              disabled={!hasClient || selectedCount === 0}
              className="btn-outline"
              title={!hasClient ? t("pickClient") : undefined}
            >
              <Briefcase className="w-4 h-4" />
              {t("buySelected")}
            </button>
            <button
              onClick={onOneClickSector}
              disabled={!hasClient || compliantInSector === 0}
              className="btn-gradient"
              title={!hasClient ? t("pickClient") : undefined}
            >
              <Zap className="w-4 h-4" />
              {t("oneClickSector")}
            </button>
          </div>

          {!hasClient ? (
            <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1">
              {t("pickClients")} →{" "}
              <span className="text-muted ms-1">
                {locale === "ar"
                  ? "استخدم الشريط أعلى الصفحة."
                  : "Use the picker at the top of the page."}
              </span>
            </p>
          ) : nonCompliantInSector > 0 ? (
            <p className="text-xs text-muted mt-2">
              {t("shariahExcluded", { n: nonCompliantInSector })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Confirmation modal
// -----------------------------------------------------------------------------

function ConfirmModal({
  locale,
  basket,
  totalSar,
  method,
  customWeights,
  onCustomChange,
  executing,
  onClose,
  onConfirm,
}: {
  locale: string;
  basket: { stock: Asset; amountSar: number }[];
  totalSar: number;
  method: AllocationMethod;
  customWeights: Record<string, number>;
  onCustomChange: (symbol: string, value: number) => void;
  executing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("sectors");
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
      style={{ background: "rgba(10,46,31,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl shadow-soft my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t("confirmTitle")}</h2>
            <p className="text-xs text-muted">{t("confirmHint")}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            {t("perStock")}
          </p>
          {basket.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">—</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("colSymbol")}</th>
                  <th>{t("colName")}</th>
                  <th className="text-end">{t("colCap")}</th>
                  <th className="text-end">SAR</th>
                  {method === "custom" ? <th className="text-end">%</th> : null}
                </tr>
              </thead>
              <tbody>
                {basket.map((row) => (
                  <tr key={row.stock.symbol}>
                    <td>
                      <span className="font-mono font-semibold text-deep">
                        {row.stock.symbol}
                      </span>
                    </td>
                    <td className="text-sm">
                      {locale === "ar" ? row.stock.nameAr : row.stock.nameEn}
                    </td>
                    <td className="text-end tabular text-xs text-muted">
                      ${formatCap(row.stock.marketCapUsd)}B
                    </td>
                    <td className="text-end tabular font-medium">
                      {fmtSar(row.amountSar)}{" "}
                      <span className="text-xs text-muted font-normal">SAR</span>
                    </td>
                    {method === "custom" ? (
                      <td className="text-end">
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={customWeights[row.stock.symbol] ?? 0}
                          onChange={(e) =>
                            onCustomChange(row.stock.symbol, Number(e.target.value))
                          }
                          className="input w-16 py-1 px-1.5 text-end tabular text-xs"
                          dir="ltr"
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
                <tr className="bg-ash-50/60 font-semibold">
                  <td colSpan={3}>{locale === "ar" ? "الإجمالي" : "Total"}</td>
                  <td className="text-end tabular">
                    {fmtSar(totalSar)}{" "}
                    <span className="text-xs text-muted font-normal">SAR</span>
                  </td>
                  {method === "custom" ? <td></td> : null}
                </tr>
              </tbody>
            </table>
          )}

          <p className="text-[11px] text-ash-400 mt-3 tabular">
            FX assumed at 1 USD = {USD_TO_SAR} SAR for demo. Prices delayed 15
            min.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={executing || basket.length === 0}
            className="btn-gradient"
          >
            {executing ? t("executing") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
