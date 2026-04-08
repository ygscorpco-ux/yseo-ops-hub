import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ConnectionStatus,
  CustomerStatusTag,
  IssueSeverity,
  SuggestionStatus,
} from "@/lib/yseo/types";

type StatusValue =
  | CustomerStatusTag
  | ConnectionStatus
  | IssueSeverity
  | SuggestionStatus;

const toneMap: Record<StatusValue, string> = {
  "긴급 조치": "bg-rose-50 text-rose-700 ring-rose-200",
  "오늘 확인": "bg-amber-50 text-amber-700 ring-amber-200",
  관찰: "bg-sky-50 text-sky-700 ring-sky-200",
  정상: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  attention: "bg-amber-50 text-amber-700 ring-amber-200",
  blocked: "bg-rose-50 text-rose-700 ring-rose-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  medium: "bg-sky-50 text-sky-700 ring-sky-200",
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-sky-50 text-sky-700 ring-sky-200",
  executed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paused: "bg-slate-100 text-slate-600 ring-slate-200",
};

interface StatusBadgeProps {
  value: StatusValue;
  label?: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 shadow-none",
        toneMap[value],
        className,
      )}
    >
      {label ?? value}
    </Badge>
  );
}
