import { cn } from "@/lib/utils";

export type StateChipTone =
  | "slate"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet";

const toneClasses: Record<StateChipTone, string> = {
  slate: "border border-slate-200 bg-slate-100 text-slate-700",
  sky: "border border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border border-amber-200 bg-amber-50 text-amber-700",
  rose: "border border-rose-200 bg-rose-50 text-rose-700",
  violet: "border border-violet-200 bg-violet-50 text-violet-700",
};

interface StateChipProps {
  label: string;
  tone?: StateChipTone;
  className?: string;
}

export function StateChip({
  label,
  tone = "slate",
  className,
}: StateChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
