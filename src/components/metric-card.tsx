import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  className?: string;
}

export function MetricCard({ label, value, helper, className }: MetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm",
        className,
      )}
    >
      <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}
