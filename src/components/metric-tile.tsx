import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: string;
  helper: string;
  tone: "critical" | "warning" | "info" | "success";
}

const toneClasses = {
  critical: "border-destructive/20 bg-destructive/6",
  warning: "border-warning/20 bg-warning/7",
  info: "border-info/15 bg-info/6",
  success: "border-success/18 bg-success/6",
};

export function MetricTile({ label, value, helper, tone }: MetricTileProps) {
  return (
    <article
      className={cn(
        "flex min-h-32 flex-col justify-between rounded-[24px] border p-4",
        toneClasses[tone],
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <strong className="text-3xl font-semibold tracking-tight">{value}</strong>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
    </article>
  );
}
