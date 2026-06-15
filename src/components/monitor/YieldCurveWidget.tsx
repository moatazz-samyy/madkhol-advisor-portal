"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { WidgetCard } from "./IndicesWidget";
import yc from "@/lib/monitor/yield-curve.json";
import { cn } from "@/lib/cn";

export function YieldCurveWidget() {
  const t = useTranslations("monitor");
  const items = yc.items;

  const chartData = items.map((p) => ({ tenor: p.tenor, yieldPct: p.yieldPct }));
  const last = items[items.length - 1];
  const first = items[0];
  const spread = (last.yieldPct - first.yieldPct).toFixed(2);
  const inverted = last.yieldPct < first.yieldPct;

  return (
    <WidgetCard
      title={t("widget_yieldCurve")}
      icon={<TrendingUp className="w-4 h-4" />}
    >
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            10Y
          </p>
          <p className="text-base font-semibold tabular">
            {items.find((i) => i.tenor === "10Y")?.yieldPct.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            2Y
          </p>
          <p className="text-base font-semibold tabular">
            {items.find((i) => i.tenor === "2Y")?.yieldPct.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            30Y − 1M
          </p>
          <p
            className={cn(
              "text-base font-semibold tabular",
              inverted ? "text-red-600" : "text-madkhol-700",
            )}
          >
            {spread}%
            {inverted ? (
              <span className="text-[10px] text-red-600 ms-1 align-middle">
                {t("inverted")}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="h-[180px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={160}>
          <LineChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F0" vertical={false} />
            <XAxis dataKey="tenor" stroke="#8A968F" fontSize={11} />
            <YAxis
              stroke="#8A968F"
              fontSize={11}
              width={42}
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              domain={["dataMin - 0.2", "dataMax + 0.2"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E7ECE9",
                fontSize: 12,
              }}
              formatter={(v) => `${Number(v).toFixed(2)}%`}
            />
            <Line
              type="monotone"
              dataKey="yieldPct"
              stroke="#0C3D2E"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#2BBE7E" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
