"use client";

import { useTranslations } from "next-intl";
import { Briefcase, PieChart, Sliders, X, BarChart3 } from "lucide-react";

export function SelectionBar({
  count,
  onClear,
  onAddToModel,
  onAddToClient,
  onOptimize,
  onCompare,
}: {
  count: number;
  onClear: () => void;
  onAddToModel: () => void;
  onAddToClient: () => void;
  onOptimize: () => void;
  onCompare?: () => void;
}) {
  const t = useTranslations("search");
  const to = useTranslations("optimizer");
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="container mx-auto px-6 pb-4">
        <div className="pointer-events-auto card p-3 flex items-center gap-2 shadow-soft bg-white max-w-4xl mx-auto flex-wrap">
          <button
            onClick={onClear}
            className="btn-ghost text-xs"
            aria-label={t("clearSelection")}
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold tabular flex-1 min-w-[120px]">
            {t("selectedCount", { n: count })}
          </span>
          {onCompare ? (
            <button onClick={onCompare} className="btn-outline">
              <BarChart3 className="w-4 h-4" />
              {t("compare")}
            </button>
          ) : null}
          <button onClick={onOptimize} className="btn-outline">
            <Sliders className="w-4 h-4" />
            {to("optimize")}
          </button>
          <button onClick={onAddToModel} className="btn-outline">
            <PieChart className="w-4 h-4" />
            {t("addToModel")}
          </button>
          <button onClick={onAddToClient} className="btn-gradient">
            <Briefcase className="w-4 h-4" />
            {t("addToClient")}
          </button>
        </div>
      </div>
    </div>
  );
}
