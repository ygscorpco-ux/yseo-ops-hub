import { StateChip, type StateChipTone } from "@/components/state-chip";
import type {
  ConnectionStatus,
  CustomerStatusTag,
  IssueSeverity,
  SuggestionStatus,
  SyncStatus,
} from "@/lib/yseo/types";

type StatusValue =
  | CustomerStatusTag
  | ConnectionStatus
  | IssueSeverity
  | SuggestionStatus
  | SyncStatus;

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
  idle: "slate",
  running: "sky",
  succeeded: "emerald",
  failed: "rose",
};

const labelMap: Record<StatusValue, string> = {
  "긴급 조치": "긴급 조치",
  "오늘 확인": "오늘 확인",
  관찰: "관찰",
  정상: "정상",
  connected: "정상 연결",
  attention: "확인 필요",
  blocked: "차단",
  critical: "긴급",
  high: "높음",
  medium: "중간",
  low: "낮음",
  pending: "승인 대기",
  approved: "승인됨",
  executed: "실행 완료",
  paused: "보류",
  idle: "대기",
  running: "실행 중",
  succeeded: "완료",
  failed: "실패",
};

interface StatusBadgeProps {
  value: StatusValue;
  label?: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  return (
    <StateChip
      label={label ?? labelMap[value]}
      tone={toneMap[value]}
      className={className}
    />
  );
}
