"use client";

import { startTransition, useState } from "react";
import { FileTextIcon, RefreshCwIcon } from "lucide-react";

import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { StatusBadge } from "@/components/status-badge";
import type { CustomerStatusTag } from "@/lib/yseo/types";
import {
  compactSecondaryActionClass,
  fieldClass,
  primaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

interface MonthlyReportQueueEntry {
  customerId: string;
  customerName: string;
  statusTag: CustomerStatusTag;
  hasDraft: boolean;
  finalized: boolean;
  openIssueCount: number;
  pendingSuggestionCount: number;
  blockedConnectionCount: number;
  updatedAt?: string;
}

interface MonthlyReportBatchStatusPayload {
  status: "ok";
  targetPeriod: string;
  totalCustomers: number;
  readyDrafts: number;
  finalizedDrafts: number;
  missingDrafts: number;
  blockedCustomers: number;
  queue: MonthlyReportQueueEntry[];
}

interface MonthlyReportBatchPanelProps {
  initialStatus: MonthlyReportBatchStatusPayload;
}

interface BatchResponse {
  status: "ok" | "error";
  message: string;
  generatedCount?: number;
  updatedCount?: number;
  targetPeriod?: string;
}

export function MonthlyReportBatchPanel({
  initialStatus,
}: MonthlyReportBatchPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refresh() {
    setErrorMessage(null);

    try {
      const response = await fetch("/api/reports/monthly", {
        cache: "no-store",
      });
      const data = (await response.json()) as MonthlyReportBatchStatusPayload;

      if (!response.ok) {
        throw new Error("월간 리포트 상태를 불러오지 못했습니다.");
      }

      setStatus(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "월간 리포트 상태를 불러오지 못했습니다.",
      );
    }
  }

  function runBatch() {
    if (token.trim().length === 0) {
      setErrorMessage("월말 초안 생성에는 Sync 토큰이 필요합니다.");
      return;
    }

    startTransition(async () => {
      setIsSubmitting(true);
      setMessage(null);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/reports/monthly", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        });
        const data = (await response.json()) as BatchResponse;

        if (!response.ok || data.status !== "ok") {
          throw new Error(data.message ?? "월말 초안 생성에 실패했습니다.");
        }

        setMessage(
          [
            data.message,
            data.generatedCount !== undefined
              ? `신규 ${data.generatedCount}건`
              : null,
            data.updatedCount !== undefined
              ? `갱신 ${data.updatedCount}건`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
        );

        await refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "월말 초안 생성에 실패했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <SectionCard
      eyebrow="월말 배치"
      title={`${status.targetPeriod} 리포트 준비`}
      description="월말 일괄 발행 직전에 전체 고객 초안을 다시 만들고, 아직 비어 있는 고객만 먼저 채웁니다."
      action={
        <button
          type="button"
          onClick={() => void refresh()}
          className={`inline-flex items-center ${compactSecondaryActionClass}`}
        >
          <RefreshCwIcon className="mr-1.5 size-4" />
          상태 새로고침
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StateChip label={`대상 ${status.totalCustomers}`} tone="slate" />
        <StateChip label={`초안 있음 ${status.readyDrafts}`} tone="sky" />
        <StateChip label={`발행 완료 ${status.finalizedDrafts}`} tone="emerald" />
        <StateChip label={`초안 없음 ${status.missingDrafts}`} tone="amber" />
        <StateChip label={`연결 점검 ${status.blockedCustomers}`} tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              운영 기준
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-700">
              이 기능은 월말에 전체 고객 리포트 초안을 한 번에 다시 정리합니다.
              최종 발행 문구와 고객 전달은 여전히 운영자가 검토합니다.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              Sync 토큰
            </span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="SYNC_API_TOKEN 입력"
              className={`${fieldClass} w-full`}
            />
          </label>

          <button
            type="button"
            onClick={runBatch}
            className={`inline-flex items-center ${primaryActionClass}`}
            disabled={isSubmitting}
          >
            <FileTextIcon className="mr-1.5 size-4" />
            {isSubmitting ? "초안 정리 중" : "월말 초안 일괄 생성"}
          </button>

          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              월말 발행 대기 고객
            </div>
            <div className="mt-3 space-y-3">
              {status.queue.slice(0, 6).map((entry) => (
                <div
                  key={entry.customerId}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-950">
                        {entry.customerName}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge value={entry.statusTag} />
                        <StateChip
                          label={entry.hasDraft ? "초안 있음" : "초안 없음"}
                          tone={entry.hasDraft ? "sky" : "amber"}
                        />
                        {entry.finalized ? (
                          <StateChip label="발행 완료" tone="emerald" />
                        ) : null}
                      </div>
                    </div>
                    {entry.updatedAt ? (
                      <span className="text-xs leading-5 text-slate-500">
                        {formatRelativeTime(entry.updatedAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs leading-5 text-slate-500">
                    <span>열린 이슈 {entry.openIssueCount}건</span>
                    <span>승인 대기 {entry.pendingSuggestionCount}건</span>
                    <span>연결 점검 {entry.blockedConnectionCount}건</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
