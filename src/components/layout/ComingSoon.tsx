import { Construction } from "lucide-react";

type Props = {
  title: string;
  description: string;
  hint?: string;
};

export function ComingSoon({ title, description, hint }: Props) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted mt-1">{description}</p>
      </header>
      <div className="card p-12 grid place-items-center text-center bg-brand-soft border-madkhol-100">
        <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center text-madkhol-700 shadow-card mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <p className="text-deep font-medium">
          {hint ?? "This screen lands in the next build phase."}
        </p>
        <p className="text-xs text-muted mt-1">
          Spine is locked first — tools + differentiators follow after review.
        </p>
      </div>
    </div>
  );
}
