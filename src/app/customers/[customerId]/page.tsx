import Link from "next/link";
import { notFound } from "next/navigation";

import { ChannelBadge } from "@/components/channel-badge";
import { CustomerConnectionEditor } from "@/components/customer-connection-editor";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { StrategyBootstrapDialog } from "@/components/strategy-bootstrap-dialog";
import { StrategyOpsPanel } from "@/components/strategy-ops-panel";
import { isGoogleOAuthConfigured } from "@/lib/yseo/google-search-console";
import { auditNaverCustomerAccess } from "@/lib/yseo/naver-access";
import { getCustomerDetailView } from "@/lib/yseo/selectors";
import { getCustomerStrategyWorkspace } from "@/lib/yseo/strategy-hub";
import {
  compactSecondaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{
    googleConnected?: string;
    googleOAuthError?: string;
  }>;
}) {
  const { customerId } = await params;
  const { googleConnected, googleOAuthError } = await searchParams;
  const [detail, strategyWorkspace] = await Promise.all([
    getCustomerDetailView(customerId),
    getCustomerStrategyWorkspace(customerId),
  ]);

  if (!detail) {
    notFound();
  }

  const naverConnection = detail.connections.find(
    (connection) => connection.channelType === "naver-searchad",
  );
  const searchConsoleConnection = detail.connections.find(
    (connection) => connection.channelType === "search-console",
  );
  const naverConnectionAudit = naverConnection
    ? await auditNaverCustomerAccess(naverConnection.externalAccountRef)
    : null;
  const naverAccessMissing = Boolean(
    naverConnection && naverConnectionAudit?.ok && !naverConnectionAudit.isAccessible,
  );
  const displayConnections = detail.connections.map((connection) => {
    if (!naverAccessMissing || connection.id !== naverConnection?.id) {
      return connection;
    }

    return {
      ...connection,
      connectionStatus: "attention" as const,
      lastErrorCode: connection.lastErrorCode ?? "NAVER_ACCESS_MISSING",
      syncHeadline: `현재 NAVER API 계정에서 ${connection.externalAccountRef} 접근 권한이 확인되지 않았습니다.`,
    };
  });
  const blockedConnections = displayConnections.filter(
    (connection) => connection.connectionStatus !== "connected",
  );
  const googleOAuthConfigured = isGoogleOAuthConfigured();
  const activeExecutionRequests = strategyWorkspace.executionRequests.filter(
    (request) => request.approvalStatus === "pending" || request.approvalStatus === "approved",
  );
  const visibleSuggestions = detail.suggestionSet.slice(0, 4);
  const visibleAlerts = strategyWorkspace.recentAlertEvents.slice(0, 5);
  const visibleEvaluations = strategyWorkspace.evaluations.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="고객 상세"
        title={detail.customer.name}
        description="채널 연결, 자동 감시, 전략팩, 제안 실행 상태를 한 화면에서 확인합니다."
        actions={
          <Link href="/customers" className={secondaryActionClass}>
            고객 목록으로
          </Link>
        }
      />

      {googleConnected === "search-console" ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
              SEARCH CONSOLE 연결 완료
            </div>
            <p className="text-sm leading-6 text-slate-700">
              property 연결과 최근 7일 검증 수집이 끝났습니다.
            </p>
          </div>
        </section>
      ) : null}

      {googleOAuthError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
              GOOGLE 연결 오류
            </div>
            <p className="text-sm leading-6 text-slate-700">{googleOAuthError}</p>
          </div>
        </section>
      ) : null}

      {naverAccessMissing ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
              NAVER 접근 권한 필요
            </div>
            <p className="text-sm leading-6 text-slate-700">
              현재 API 계정에서는 {naverConnection?.externalAccountRef} 고객에 접근할 수 없습니다.
              광고주센터에서 멤버 초대 또는 계정 연동을 먼저 완료해야 실제 수집이 됩니다.
            </p>
          </div>
        </section>
      ) : null}

      {blockedConnections.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">
              연결 확인 필요
            </div>
            <p className="text-sm leading-6 text-slate-700">
              {blockedConnections.map((connection) => connection.syncHeadline).join(" / ")}
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard eyebrow="개요" title="현재 상태">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.customer.statusTag} />
            <span className="text-sm text-slate-500">
              마지막 확인 {formatRelativeTime(detail.customer.lastActionAt)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                연결 채널
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                {displayConnections.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                열린 경고
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                {detail.openIssues.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                전략 팩
              </div>
              <div className="mt-1.5 text-sm font-medium text-slate-950">
                {strategyWorkspace.strategyPack ? "세팅 완료" : "미세팅"}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="채널 연결"
          title="연결 상태"
          action={
            <>
              <CustomerConnectionEditor
                customerId={detail.customer.id}
                customerName={detail.customer.name}
                connection={naverConnection}
              />
              {googleOAuthConfigured ? (
                <Link
                  href={`/api/oauth/google/search-console/start?customerId=${detail.customer.id}`}
                  className={compactSecondaryActionClass}
                >
                  {searchConsoleConnection ? "Search Console 재연결" : "Search Console 연결"}
                </Link>
              ) : null}
            </>
          }
        >
          <div className="space-y-3">
            {displayConnections.length > 0 ? (
              displayConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChannelBadge channel={connection.channelType} />
                        <span className="text-xs leading-5 text-slate-500">
                          {connection.externalPropertyRef ?? connection.externalAccountRef}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {connection.syncHeadline}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <StatusBadge value={connection.syncStatus} />
                        <span className="text-xs leading-5 text-slate-500">
                          마지막 동기화 {formatRelativeTime(connection.lastSyncAt)}
                        </span>
                        {connection.lastErrorCode ? (
                          <span className="text-xs leading-5 text-rose-600">
                            오류 {connection.lastErrorCode}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <StatusBadge value={connection.connectionStatus} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                아직 연결된 채널이 없습니다. 위 버튼에서 NAVER 또는 Search Console을
                연결해 주세요.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="전략 팩"
          title={strategyWorkspace.strategyPack ? "저장된 전략" : "전략 세팅 필요"}
          action={
            <StrategyBootstrapDialog
              customerId={detail.customer.id}
              customerName={detail.customer.name}
              strategyPack={strategyWorkspace.strategyPack}
            />
          }
        >
          {strategyWorkspace.strategyPack ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-700">
                {strategyWorkspace.strategyPack.packSummary}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    목표 전환
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-950">
                    {strategyWorkspace.strategyPack.goalProfile.conversionGoal}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    월 예산
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-950">
                    {strategyWorkspace.strategyPack.goalProfile.monthlyBudget.toLocaleString(
                      "ko-KR",
                    )}
                    원
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    다음 재검토
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-950">
                    {strategyWorkspace.strategyPack.nextReviewAt
                      ? formatRelativeTime(strategyWorkspace.strategyPack.nextReviewAt)
                      : "미정"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                    우선 키워드 클러스터
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {strategyWorkspace.strategyPack.keywordClusters.length > 0 ? (
                      strategyWorkspace.strategyPack.keywordClusters.slice(0, 6).map((cluster) => (
                        <span
                          key={cluster}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                        >
                          {cluster}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">아직 저장된 클러스터가 없습니다.</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                    우선 실행 2주 계획
                  </div>
                  {strategyWorkspace.strategyPack.twoWeekPlan.length > 0 ? (
                    <ul className="space-y-1 text-sm leading-6 text-slate-700">
                      {strategyWorkspace.strategyPack.twoWeekPlan.slice(0, 4).map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">
                      아직 2주 실행 계획이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              GPT Pro 리서치 또는 운영자 입력으로 전략팩을 먼저 저장해 주세요. 자동
              알림과 변경 제안은 이 전략팩의 KPI와 방향을 기준으로 강화됩니다.
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="자동 감시" title="수집 / 알림 / 실행">
          <StrategyOpsPanel
            customerId={detail.customer.id}
            executionRequests={activeExecutionRequests}
          />
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="최근 경고" title="자동 감시 결과">
          {visibleAlerts.length === 0 ? (
            <p className="text-sm leading-6 text-slate-600">
              아직 자동 생성된 경고가 없습니다. 먼저 채널을 수집하거나 알림 규칙을
              평가해 주세요.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={event.severity} />
                    <ChannelBadge channel={event.channelType} />
                    <span className="text-xs leading-5 text-slate-500">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-slate-950">{event.title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{event.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    권장 액션: {event.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="제안 / 평가" title="최근 전략 제안">
          <div className="space-y-4">
            {visibleSuggestions.length === 0 ? (
              <p className="text-sm leading-6 text-slate-600">
                아직 생성된 전략 제안이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={suggestion.approvalStatus} />
                      <ChannelBadge channel={suggestion.channelType} />
                    </div>
                    <div className="mt-2 font-medium text-slate-950">
                      {suggestion.title}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {suggestion.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {visibleEvaluations.length > 0 ? (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  최근 효과 평가
                </div>
                {visibleEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={evaluation.outcome} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {evaluation.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="현재 경고" title="원본 채널 기준 이슈">
          {detail.openIssues.length === 0 ? (
            <p className="text-sm leading-6 text-slate-600">
              현재 열린 이슈가 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {detail.openIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={issue.severity} />
                    <ChannelBadge channel={issue.channelType} />
                  </div>
                  <div className="mt-2 font-medium text-slate-950">{issue.title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{issue.summary}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="최근 요약" title="채널별 상태 요약">
          {detail.insights.length === 0 ? (
            <p className="text-sm leading-6 text-slate-600">
              아직 수집된 채널 요약이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {detail.insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                        {insight.freshnessLabel}
                      </div>
                      <div className="mt-1 text-base font-semibold tracking-tight text-slate-950">
                        {insight.headline}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {insight.note}
                      </p>
                    </div>
                    <ChannelBadge channel={insight.channelType} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {insight.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                          {metric.label}
                        </div>
                        <div className="mt-1.5 text-lg font-semibold text-slate-950">
                          {metric.value}
                        </div>
                        {metric.delta ? (
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {metric.delta}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
