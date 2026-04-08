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
  "긴급 조치": "bg-destructive/12 text-destructive ring-destructive/10",
  "오늘 점검": "bg-warning/18 text-warning-foreground ring-warning/15",
  관찰: "bg-info/14 text-info-foreground ring-info/10",
  정상: "bg-success/14 text-success-foreground ring-success/10",
  connected: "bg-success/14 text-success-foreground ring-success/10",
  attention: "bg-warning/18 text-warning-foreground ring-warning/15",
  blocked: "bg-destructive/12 text-destructive ring-destructive/10",
  critical: "bg-destructive/12 text-destructive ring-destructive/10",
  high: "bg-warning/18 text-warning-foreground ring-warning/15",
  medium: "bg-info/14 text-info-foreground ring-info/10",
  low: "bg-muted text-muted-foreground ring-border",
  pending: "bg-warning/18 text-warning-foreground ring-warning/15",
  approved: "bg-info/14 text-info-foreground ring-info/10",
  executed: "bg-success/14 text-success-foreground ring-success/10",
  paused: "bg-muted text-muted-foreground ring-border",
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
        "rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1",
        toneMap[value],
        className,
      )}
    >
      {label ?? value}
    </Badge>
  );
}
