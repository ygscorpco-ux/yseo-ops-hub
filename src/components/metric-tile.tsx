import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: string;
  helper: string;
  tone: "critical" | "warning" | "info" | "success";
}

const toneClasses = {
  critical: "border-rose-200 bg-white",
  warning: "border-amber-200 bg-white",
  info: "border-slate-200 bg-white",
  success: "border-emerald-200 bg-white",
};

export function MetricTile({ label, value, helper, tone }: MetricTileProps) {
  return (
    <article
      className={cn(
        "flex min-h-28 flex-col justify-between rounded-xl border px-4 py-3 shadow-sm",
        toneClasses[tone],
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <strong className="text-2xl font-semibold tracking-tight text-slate-950">
          {value}
        </strong>
      </div>
      <p className="text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  );
}
