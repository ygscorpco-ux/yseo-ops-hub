import Link from "next/link";
import { notFound } from "next/navigation";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
import { getCustomerDetailView } from "@/lib/yseo/selectors";
import {
  compactSecondaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const detail = await getCustomerDetailView(customerId);

  if (!detail) {
    notFound();
  }

  const blockedConnections = detail.connections.filter(
    (connection) => connection.connectionStatus !== "connected",
  );
  const latestReport = detail.reportDrafts[0];
  const pendingSuggestions = detail.suggestionSet.filter(
    (suggestion) => suggestion.approvalStatus === "pending",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CUSTOMER DETAIL"
        title={detail.customer.name}
        description={detail.customer.focus}
        actions={
          <>
            <Link href="/customers" className={secondaryActionClass}>
              고객 리스트로
            </Link>
            {pendingSuggestions.length > 0 ? (
              <SuggestionReviewDialog
                customerName={detail.customer.name}
                suggestions={pendingSuggestions}
                triggerLabel={`제안 ${pendingSuggestions.length}건`}
              />
            ) : null}
            {latestReport ? (
              <ReportPreviewDialog
                customerName={detail.customer.name}
                report={latestReport}
              />
            ) : null}
          </>
        }
      />

      {blockedConnections.length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
              CONNECTION ALERT
            </div>
            <h2 className="text-base font-semibold tracking-tight text-slate-950">
              연결 상태 확인이 필요합니다
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              {blockedConnections.map((connection) => connection.syncHeadline).join(" / ")}
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="OVERVIEW" title="고객 상태">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.customer.statusTag} />
            <span className="text-sm text-slate-500">
              {detail.customer.segment} · 담당 {detail.customer.primaryManager}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                열린 이슈
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                {detail.openIssues.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                승인 대기
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                {pendingSuggestions.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                마지막 액션
              </div>
              <div className="mt-1.5 text-sm font-medium text-slate-950">
                {formatRelativeTime(detail.customer.lastActionAt)}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="CONNECTIONS"
          title="채널 연결 상태"
          description="외부 채널은 하나의 서비스처럼 보이되, 연결 상태와 오류는 채널별로 분리해 보여줍니다."
        >
          <div className="space-y-3">
            {detail.connections.map((connection) => (
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
                  </div>
                  <StatusBadge value={connection.connectionStatus} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="ISSUES" title="열린 이슈">
          <div className="space-y-4">
            {detail.openIssues.map((issue) => (
              <div key={issue.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={issue.severity} />
                  <ChannelBadge channel={issue.channelType} />
                </div>
                <div className="mt-2 font-medium text-slate-950">{issue.title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{issue.summary}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  권장 액션: {issue.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="MEMOS" title="내부 메모">
          <div className="space-y-4">
            {detail.memos.map((memo) => (
              <div key={memo.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value="low" label={memo.memoType} />
                  <span className="text-xs leading-5 text-slate-500">
                    {memo.createdBy} · {formatRelativeTime(memo.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{memo.body}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        eyebrow="CHANNEL SIGNALS"
        title="채널별 신호"
        description="최근 7일, 30일 기준 신호만 얕게 요약해 빠르게 판단할 수 있게 둡니다."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {detail.insights.map((insight) => (
            <div key={insight.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    {insight.freshnessLabel}
                  </div>
                  <div className="mt-1 text-base font-semibold tracking-tight text-slate-950">
                    {insight.headline}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{insight.note}</p>
                </div>
                <ChannelBadge channel={insight.channelType} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {insight.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                      {metric.label}
                    </div>
                    <div className="mt-1.5 text-lg font-semibold text-slate-950">
                      {metric.value}
                    </div>
                    {metric.delta ? (
                      <div className="mt-1 text-xs leading-5 text-slate-500">{metric.delta}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard eyebrow="ACTIVITY" title="최근 작업 이력">
        <div className="space-y-4">
          {detail.logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      value={
                        log.resultStatus === "done"
                          ? "executed"
                          : log.resultStatus === "queued"
                            ? "pending"
                            : "blocked"
                      }
                      label={log.resultStatus}
                    />
                    <span className="font-medium text-slate-950">{log.summary}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    {log.actorName} · {log.actionType}
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  {formatRelativeTime(log.executedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Link href="/customers" className={compactSecondaryActionClass}>
          고객 리스트로 돌아가기
        </Link>
      </div>
    </div>
  );
}
