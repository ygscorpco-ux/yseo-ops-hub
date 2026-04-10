"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { ExecutionRequest } from "@/lib/yseo/strategy-types";
import {
  compactSecondaryActionClass,
  fieldClass,
  primaryActionClass,
} from "@/lib/yseo/ui";

interface StrategyOpsPanelProps {
  customerId: string;
  executionRequests: ExecutionRequest[];
}

interface RouteResult {
  message?: string;
  status?: string;
}

function localizeActionLabel(actionType: string) {
  switch (actionType) {
    case "naver-rerun-sync":
      return "NAVER 재수집";
    case "search-console-rerun-sync":
      return "Search Console 재수집";
    default:
      return actionType;
  }
}

export function StrategyOpsPanel({
  customerId,
  executionRequests,
}: StrategyOpsPanelProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function runProtectedRequest(path: string, body: Record<string, unknown>) {
    if (!token.trim()) {
      throw new Error("운영 토큰을 먼저 입력해 주세요.");
    }

    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as RouteResult;

    if (!response.ok) {
      throw new Error(payload.message ?? "운영 요청 처리에 실패했습니다.");
    }

    return payload;
  }

  function handleSync(channel?: "naver-searchad" | "search-console") {
    const actionKey = channel ?? "all";

    startTransition(async () => {
      setPendingAction(actionKey);
      setMessage(null);
      setErrorMessage(null);

      try {
        await runProtectedRequest("/api/sync/run", {
          customerId,
          channel,
        });
        setMessage(
          channel === "search-console"
            ? "Search Console 자동 확인을 실행했습니다."
            : channel === "naver-searchad"
              ? "NAVER 자동 확인을 실행했습니다."
              : "전체 자동 확인을 실행했습니다.",
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "자동 확인 실행에 실패했습니다.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleAlerts() {
    startTransition(async () => {
      setPendingAction("alerts");
      setMessage(null);
      setErrorMessage(null);

      try {
        await runProtectedRequest("/api/alerts/evaluate", {
          customerId,
          mode: "immediate",
        });
        setMessage("알림 규칙을 다시 평가했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "알림 재평가에 실패했습니다.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleRecommendations() {
    startTransition(async () => {
      setPendingAction("recommendations");
      setMessage(null);
      setErrorMessage(null);

      try {
        await runProtectedRequest("/api/recommendations/generate", {
          customerId,
          source: "manual",
        });
        setMessage("전략 제안을 다시 생성했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "전략 제안 생성에 실패했습니다.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleApprove(suggestionId: string) {
    startTransition(async () => {
      setPendingAction(`approve:${suggestionId}`);
      setMessage(null);
      setErrorMessage(null);

      try {
        await runProtectedRequest(`/api/recommendations/${suggestionId}/approve`, {
          approvedBy: "YSEO Operator",
        });
        setMessage("제안을 승인했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "제안 승인에 실패했습니다.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleExecute(executionRequestId: string) {
    startTransition(async () => {
      setPendingAction(`execute:${executionRequestId}`);
      setMessage(null);
      setErrorMessage(null);

      try {
        await runProtectedRequest("/api/executions/run", {
          executionRequestId,
          actorName: "YSEO Operator",
        });
        setMessage("승인된 실행 요청을 수행했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "실행 요청 처리에 실패했습니다.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
          운영 토큰
        </span>
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="SYNC_API_TOKEN 또는 CRON_SECRET"
          className={`${fieldClass} w-full`}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSync("naver-searchad")}
          className={primaryActionClass}
          disabled={pendingAction !== null}
        >
          {pendingAction === "naver-searchad" ? "실행 중" : "NAVER 다시 확인"}
        </button>
        <button
          type="button"
          onClick={() => handleSync("search-console")}
          className={compactSecondaryActionClass}
          disabled={pendingAction !== null}
        >
          {pendingAction === "search-console" ? "실행 중" : "Search Console 다시 확인"}
        </button>
        <button
          type="button"
          onClick={handleAlerts}
          className={compactSecondaryActionClass}
          disabled={pendingAction !== null}
        >
          {pendingAction === "alerts" ? "평가 중" : "알림 재평가"}
        </button>
        <button
          type="button"
          onClick={handleRecommendations}
          className={compactSecondaryActionClass}
          disabled={pendingAction !== null}
        >
          {pendingAction === "recommendations" ? "생성 중" : "제안 다시 생성"}
        </button>
      </div>

      {executionRequests.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
            승인형 실행
          </div>
          <div className="space-y-2">
            {executionRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-950">
                    {localizeActionLabel(request.actionType)}
                  </div>
                  <div className="text-xs leading-5 text-slate-500">
                    상태 {request.approvalStatus}
                    {request.approvedBy ? ` / 승인 ${request.approvedBy}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.suggestionId && request.approvalStatus === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(request.suggestionId!)}
                      className={compactSecondaryActionClass}
                      disabled={pendingAction !== null}
                    >
                      {pendingAction === `approve:${request.suggestionId}` ? "승인 중" : "승인"}
                    </button>
                  ) : null}
                  {request.approvalStatus === "approved" ? (
                    <button
                      type="button"
                      onClick={() => handleExecute(request.id)}
                      className={primaryActionClass}
                      disabled={pendingAction !== null}
                    >
                      {pendingAction === `execute:${request.id}` ? "실행 중" : "실행"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
  );
}
