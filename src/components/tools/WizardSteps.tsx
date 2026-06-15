import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Step = { label: string; key: string };

export function WizardSteps({
  steps,
  active,
}: {
  steps: Step[];
  active: number;
}) {
  return (
    <ol className="flex items-center gap-3 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={s.key} className="flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                done && "bg-madkhol-50 border-madkhol-200 text-madkhol-700",
                current && "bg-deep border-deep text-white",
                !done && !current && "bg-white border-border text-ash-500",
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold",
                  done && "bg-madkhol-600 text-white",
                  current && "bg-white text-deep",
                  !done && !current && "bg-ash-100 text-ash-500",
                )}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 ? (
              <span className="w-6 h-px bg-border" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
