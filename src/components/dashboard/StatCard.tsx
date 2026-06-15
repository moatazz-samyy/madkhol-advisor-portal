import { fmtSar, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Props = {
  label: string;
  value: number;
  format: "sar" | "int";
  changePct?: number;
  subtext?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "brand" | "neutral";
};

export function StatCard({
  label,
  value,
  format,
  changePct,
  subtext,
  Icon,
  tone = "neutral",
}: Props) {
  const positive = (changePct ?? 0) >= 0;
  const Trend = positive ? ArrowUpRight : ArrowDownRight;
  const isBrand = tone === "brand";

  return (
    <div
      className={cn(
        "stat-card relative overflow-hidden",
        isBrand && "bg-brand-gradient text-white border-transparent",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-xs uppercase tracking-wider font-semibold",
          isBrand ? "text-white/80" : "text-ash-500",
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <p
        className={cn(
          "text-3xl font-semibold tabular tracking-tight mt-1",
          isBrand && "text-white",
        )}
      >
        {format === "sar" ? fmtSar(value) : value}
        {format === "sar" ? (
          <span
            className={cn(
              "ms-2 text-base font-normal",
              isBrand ? "text-white/70" : "text-ash-400",
            )}
          >
            SAR
          </span>
        ) : null}
      </p>
      {changePct !== undefined ? (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium mt-1",
            positive ? "text-madkhol-700" : "text-red-600",
            isBrand && (positive ? "text-madkhol-100" : "text-red-200"),
          )}
        >
          <Trend className="w-3.5 h-3.5" />
          <span>{fmtPct(changePct)}</span>
        </div>
      ) : null}
      {subtext ? (
        <p
          className={cn(
            "text-xs mt-1",
            isBrand ? "text-white/70" : "text-muted",
          )}
        >
          {subtext}
        </p>
      ) : null}

      {/* Decorative ring */}
      {isBrand ? (
        <div className="absolute -end-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      ) : null}
    </div>
  );
}
