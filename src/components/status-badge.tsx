import { StateChip, type StateChipTone } from "@/components/state-chip";
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

const toneMap: Record<StatusValue, StateChipTone> = {
  "긴급 조치": "rose",
  "오늘 확인": "amber",
  관찰: "sky",
  정상: "emerald",
  connected: "emerald",
  attention: "amber",
  blocked: "rose",
  critical: "rose",
  high: "amber",
  medium: "sky",
  low: "slate",
  pending: "amber",
  approved: "sky",
  executed: "emerald",
  paused: "slate",
};

interface StatusBadgeProps {
  value: StatusValue;
  label?: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  return <StateChip label={label ?? value} tone={toneMap[value]} className={className} />;
}
