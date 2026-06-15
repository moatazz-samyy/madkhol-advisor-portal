import Link from "next/link";
import { fmtSar, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

type Client = {
  id: string;
  name: string;
  nameAr: string;
  aumSar: number;
  ytdPnlPct: number;
};

export function TopClientsCard({
  clients,
  locale,
  title,
}: {
  clients: Client[];
  locale: "ar" | "en";
  title: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <ul className="divide-y divide-border">
        {clients.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/${locale}/clients/${c.id}`}
              className="flex items-center gap-3 py-3 hover:bg-ash-50 -mx-2 px-2 rounded-xl transition"
            >
              <span className="w-7 h-7 rounded-full bg-ash-100 text-ash-500 grid place-items-center text-xs font-semibold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {locale === "ar" ? c.nameAr : c.name}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm font-semibold tabular">
                  {fmtSar(c.aumSar)} <span className="text-xs text-muted font-normal">SAR</span>
                </p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    c.ytdPnlPct >= 0 ? "text-madkhol-700" : "text-red-600",
                  )}
                >
                  {fmtPct(c.ytdPnlPct)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
