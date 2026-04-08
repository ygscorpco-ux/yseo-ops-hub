import { MetricCard } from "@/components/metric-card";

interface MetricTileProps {
  label: string;
  value: string;
  helper: string;
  tone: "critical" | "warning" | "info" | "success";
}

export function MetricTile({ label, value, helper, tone }: MetricTileProps) {
  const className =
    tone === "critical"
      ? "border-rose-200"
      : tone === "warning"
        ? "border-amber-200"
        : tone === "success"
          ? "border-emerald-200"
          : undefined;

  return <MetricCard label={label} value={value} helper={helper} className={className} />;
}
