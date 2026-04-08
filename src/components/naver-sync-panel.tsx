"use client";

import { startTransition, useEffect, useState } from "react";
import { PlayIcon, RefreshCwIcon } from "lucide-react";

import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { StatusBadge } from "@/components/status-badge";
import {
  compactSecondaryActionClass,
  fieldClass,
  primaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

interface ValidationSummary {
  ok: boolean;
  connectionStatus: "connected" | "attention" | "blocked";
  message: string;
  externalRefs?: string[];
}

interface ConnectionSummary {
  total: number;
  blocked: number;
  attention: number;
  connected: number;
}

interface RecentConnection {
  id: string;
  externalAccountRef: string;
  externalPropertyRef?: string | null;
  connectionStatus: "connected" | "attention" | "blocked";
  syncStatus: "idle" | "running" | "succeeded" | "failed";
  syncHeadline: string;
  lastSyncAt: string;
}

interface RecentRun {
  id: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorSummary?: string | null;
  requiresOperatorReview: boolean;
}

interface NaverSyncStatusPayload {
  status: "ok";
  channel: string;
  credentialsConfigured: boolean;
  validation: ValidationSummary;
  connectionSummary: ConnectionSummary;
  recentConnections: RecentConnection[];
  recentRuns: RecentRun[];
  expectedAuthHeader: string;
}

interface SyncResponse {
  status: "ok" | "error";
  message: string;
  accountsProcessed?: number;
  issuesOpened?: number;
  discoveredAccounts?: number;
}

function localizeSyncMessage(message: string) {
  if (message === "NAVER SearchAd credentials are missing.") {
    return "네이버 API 자격증명이 아직 연결되지 않았습니다.";
  }

  if (message === "NAVER SearchAd connection validated.") {
    return "네이버 API 연결이 정상 검증되었습니다.";
  }

  if (message === "SYNC_API_TOKEN or AUTH_SECRET must be configured first.") {
    return "Vercel 환경변수에 SYNC_API_TOKEN 또는 AUTH_SECRET이 필요합니다.";
  }

  if (message === "Unauthorized sync request.") {
    return "입력한 Sync 토큰이 올바르지 않습니다.";
  }

  const processedMatch = message.match(/^Processed (\d+) NAVER SearchAd accounts\.$/);

  if (processedMatch) {
    return `네이버 광고계정 ${processedMatch[1]}개를 처리했습니다.`;
  }

  const syncedMatch = message.match(/^Synced (\d+) adgroups from NAVER SearchAd\.$/);

  if (syncedMatch) {
    return `네이버 광고그룹 ${syncedMatch[1]}개를 동기화했습니다.`;
  }

  return message;
}

export function NaverSyncPanel() {
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState<NaverSyncStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function refreshStatus() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/sync/naver", {
        cache: "no-store",
      });

      const data = (await response.json()) as NaverSyncStatusPayload;

      if (!response.ok) {
        throw new Error("네이버 sync 상태를 불러오지 못했습니다.");
      }

      setPayload(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "네이버 sync 상태를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  function handleRunSync() {
    if (token.trim().length === 0) {
      setErrorMessage("수동 실행 전 Sync 토큰을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      setIsSubmitting(true);
      setErrorMessage(null);
      setResultMessage(null);

      try {
        const response = await fetch("/api/sync/naver", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        });

        const data = (await response.json()) as SyncResponse;

        if (!response.ok || data.status !== "ok") {
          throw new Error(
            localizeSyncMessage(data.message ?? "네이버 sync 실행에 실패했습니다."),
          );
        }

        const summary = [
          localizeSyncMessage(data.message),
          data.accountsProcessed !== undefined
            ? `계정 ${data.accountsProcessed}개 처리`
            : null,
          data.issuesOpened !== undefined
            ? `이슈 ${data.issuesOpened}건 생성`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

        setResultMessage(summary);
        await refreshStatus();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "NAVER sync 실행에 실패했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <SectionCard
      eyebrow="네이버 운영"
      title="네이버 연결 및 수동 동기화"
      description="운영자는 대시보드 안에서 연결 상태를 확인하고, 필요할 때만 토큰으로 수동 sync를 실행합니다."
      action={
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className={`inline-flex items-center ${compactSecondaryActionClass}`}
          disabled={loading || isSubmitting}
        >
          <RefreshCwIcon className="mr-1.5 size-4" />
          상태 새로고침
        </button>
      }
    >
      {loading && !payload ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          네이버 연결 상태를 불러오는 중입니다.
        </div>
      ) : null}

      {payload ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StateChip
              label={
                payload.credentialsConfigured ? "자격증명 연결됨" : "자격증명 미설정"
              }
              tone={payload.credentialsConfigured ? "emerald" : "rose"}
            />
            <StatusBadge
              value={payload.validation.connectionStatus}
              label={payload.validation.ok ? "검증 통과" : "검증 필요"}
            />
            <StateChip
              label={`연결 ${payload.connectionSummary.connected}`}
              tone="emerald"
            />
            <StateChip
              label={`주의 ${payload.connectionSummary.attention}`}
              tone="amber"
            />
            <StateChip
              label={`차단 ${payload.connectionSummary.blocked}`}
              tone="rose"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              현재 상태
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-700">
              {localizeSyncMessage(payload.validation.message)}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  실행 가드
                </div>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  브라우저에서 토큰을 입력해야만 수동 sync를 실행합니다. 토큰 값은 저장하지 않습니다.
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

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRunSync}
                  className={`inline-flex items-center ${primaryActionClass}`}
                  disabled={
                    isSubmitting || loading || !payload.credentialsConfigured
                  }
                >
                  <PlayIcon className="mr-1.5 size-4" />
                  {isSubmitting ? "동기화 실행 중" : "수동 동기화 실행"}
                </button>
              </div>

              {resultMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                  {resultMessage}
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
                  최근 연결
                </div>
                <div className="mt-3 space-y-3">
                  {payload.recentConnections.length > 0 ? (
                    payload.recentConnections.slice(0, 3).map((connection) => (
                      <div
                        key={connection.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-slate-950">
                            {connection.externalPropertyRef ??
                              connection.externalAccountRef}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge value={connection.connectionStatus} />
                            <StatusBadge value={connection.syncStatus} />
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {localizeSyncMessage(connection.syncHeadline)}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          마지막 동기화 {formatRelativeTime(connection.lastSyncAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-slate-600">
                      아직 수집된 네이버 연결이 없습니다.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  최근 실행 기록
                </div>
                <div className="mt-3 space-y-3">
                  {payload.recentRuns.length > 0 ? (
                    payload.recentRuns.slice(0, 3).map((run) => (
                      <div
                        key={run.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge value={run.status} />
                          <span className="text-xs leading-5 text-slate-500">
                            {formatRelativeTime(run.startedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {run.errorSummary
                            ? localizeSyncMessage(run.errorSummary)
                            : run.requiresOperatorReview
                              ? "운영자 검토가 필요한 실행입니다."
                              : "최근 네이버 sync가 정상 완료되었습니다."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-slate-600">
                      아직 실행 기록이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
