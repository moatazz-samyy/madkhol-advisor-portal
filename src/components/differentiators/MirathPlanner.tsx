"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";
import { fmtSar } from "@/lib/format";
import { calculateShares, type FamilyInput, type Gender, type HeirShare } from "@/lib/mirath";
import { Printer, Share2, Scroll, UserCircle2, Minus, Plus } from "lucide-react";

type ClientBrief = {
  id: string;
  name: string;
  nameAr: string;
  aumSar: number;
  familyStructure: {
    spouse?: boolean;
    sons?: number;
    daughters?: number;
    fatherAlive?: boolean;
    motherAlive?: boolean;
  };
};

const COLORS = [
  "#0C3D2E",
  "#156E47",
  "#2BBE7E",
  "#6BE07F",
  "#A8DDBA",
  "#F5C66B",
  "#5E6964",
];

export function MirathPlanner({
  locale,
  clients,
  preselectedClientId,
}: {
  locale: string;
  clients: ClientBrief[];
  preselectedClientId: string | null;
}) {
  const t = useTranslations("mirath");
  const [clientId, setClientId] = useState<string | null>(
    preselectedClientId ?? clients[0]?.id ?? null,
  );
  const selected = clients.find((c) => c.id === clientId);

  const [gender, setGender] = useState<Gender>("male");
  const [spouseAlive, setSpouseAlive] = useState<boolean>(
    selected?.familyStructure.spouse ?? true,
  );
  const [sons, setSons] = useState<number>(selected?.familyStructure.sons ?? 0);
  const [daughters, setDaughters] = useState<number>(
    selected?.familyStructure.daughters ?? 0,
  );
  const [fatherAlive, setFatherAlive] = useState<boolean>(
    selected?.familyStructure.fatherAlive ?? false,
  );
  const [motherAlive, setMotherAlive] = useState<boolean>(
    selected?.familyStructure.motherAlive ?? true,
  );

  function switchClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setSpouseAlive(c.familyStructure.spouse ?? true);
    setSons(c.familyStructure.sons ?? 0);
    setDaughters(c.familyStructure.daughters ?? 0);
    setFatherAlive(c.familyStructure.fatherAlive ?? false);
    setMotherAlive(c.familyStructure.motherAlive ?? true);
  }

  const input: FamilyInput = {
    clientGender: gender,
    spouseAlive,
    sons,
    daughters,
    fatherAlive,
    motherAlive,
  };
  const result = useMemo(() => calculateShares(input), [input]);
  const estateValue = selected?.aumSar ?? 0;

  const chartData = useMemo(() => {
    return result.shares.map((s) => ({
      name: s.key,
      value: +(s.fraction * 100).toFixed(2),
    }));
  }, [result]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </header>

      {/* Client picker */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <UserCircle2 className="w-5 h-5 text-ash-400" />
        <select
          value={clientId ?? ""}
          onChange={(e) => switchClient(e.target.value)}
          className="input w-auto py-2 text-sm flex-1 max-w-md"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {locale === "ar" ? c.nameAr : c.name} —{" "}
              {fmtSar(c.aumSar)} SAR
            </option>
          ))}
        </select>
        <div className="ms-auto text-sm">
          <span className="text-muted">{t("estateValue")}: </span>
          <span className="font-semibold tabular">
            {fmtSar(estateValue)} SAR
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <section className="card p-5 lg:col-span-2 space-y-5">
          <h3 className="font-semibold">{t("familyTitle")}</h3>

          <div>
            <label className="label">{t("gender")}</label>
            <div className="inline-flex bg-ash-100 rounded-xl p-1">
              <Pill active={gender === "male"} onClick={() => setGender("male")}>
                {t("male")}
              </Pill>
              <Pill active={gender === "female"} onClick={() => setGender("female")}>
                {t("female")}
              </Pill>
            </div>
          </div>

          <Toggle label={t("spouse")} value={spouseAlive} onChange={setSpouseAlive} />
          <Counter label={t("sons")} value={sons} onChange={setSons} max={12} />
          <Counter label={t("daughters")} value={daughters} onChange={setDaughters} max={12} />
          <Toggle label={t("father")} value={fatherAlive} onChange={setFatherAlive} />
          <Toggle label={t("mother")} value={motherAlive} onChange={setMotherAlive} />
        </section>

        {/* Donut */}
        <section className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t("sharesTitle")}</h3>
            <div className="flex items-center gap-2">
              <button className="btn-outline text-xs">
                <Printer className="w-3.5 h-3.5" />
                {t("print")}
              </button>
              <button className="btn-outline text-xs">
                <Share2 className="w-3.5 h-3.5" />
                {t("share_action")}
              </button>
            </div>
          </div>
          {result.shares.length === 0 ? (
            <p className="text-sm text-muted py-12 text-center">
              <Scroll className="w-7 h-7 text-ash-300 mx-auto mb-2" />
              {t("noEligible")}
            </p>
          ) : (
            <>
              <div className="h-[260px] min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                  <RPieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      stroke="white"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E7ECE9",
                        fontSize: 12,
                      }}
                      formatter={(v) => [`${Number(v).toFixed(2)}%`, ""]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>

              {/* Shares table */}
              <table className="table-base mt-4">
                <thead>
                  <tr>
                    <th>{t("heir")}</th>
                    <th className="text-end">{t("share")}</th>
                    <th className="text-end">{t("amount")}</th>
                    <th>{t("rationale")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.shares.map((s, i) => (
                    <ShareRow
                      key={s.key + i}
                      share={s}
                      estateValue={estateValue}
                      color={COLORS[i % COLORS.length]}
                    />
                  ))}
                  <tr className="bg-ash-50/60 font-semibold">
                    <td>{locale === "ar" ? "الإجمالي" : "Total"}</td>
                    <td className="text-end tabular">
                      {(result.totalAssigned * 100).toFixed(1)}%
                    </td>
                    <td className="text-end tabular">
                      {fmtSar(estateValue * result.totalAssigned)} SAR
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ShareRow({
  share,
  estateValue,
  color,
}: {
  share: HeirShare;
  estateValue: number;
  color: string;
}) {
  const t = useTranslations("mirath");
  const amount = estateValue * share.fraction;
  const perPerson = estateValue * share.perPersonFraction;
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium">{t(share.labelKey)}</span>
          {share.count > 1 ? (
            <span className="badge-neutral text-[10px]">× {share.count}</span>
          ) : null}
        </div>
      </td>
      <td className="text-end tabular">{(share.fraction * 100).toFixed(2)}%</td>
      <td className="text-end tabular">
        <div className="font-medium">
          {fmtSar(amount)} <span className="text-xs text-muted font-normal">SAR</span>
        </div>
        {share.count > 1 ? (
          <div className="text-xs text-muted">
            {fmtSar(perPerson)} ×{share.count}
          </div>
        ) : null}
      </td>
      <td className="text-xs text-muted max-w-[260px]">{t(share.rationaleKey)}</td>
    </tr>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition shrink-0",
          value ? "bg-madkhol-600" : "bg-ash-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all",
            value ? "start-5" : "start-0.5",
          )}
        />
      </button>
    </label>
  );
}

function Counter({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-lg border border-border bg-white text-deep hover:bg-ash-50 grid place-items-center"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-base font-semibold tabular w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg border border-border bg-white text-deep hover:bg-ash-50 grid place-items-center"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Pill({
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
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-lg transition",
        active
          ? "bg-white text-deep shadow-card"
          : "text-ash-600 hover:text-deep",
      )}
    >
      {children}
    </button>
  );
}
