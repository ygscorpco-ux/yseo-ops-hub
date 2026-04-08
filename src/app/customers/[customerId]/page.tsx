import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangleIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCustomerDetailView } from "@/lib/yseo/selectors";
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Customer detail"
        title={detail.customer.name}
        description={detail.customer.focus}
        actions={
          <>
            <Link
              href="/customers"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              고객 리스트로
            </Link>
            {detail.suggestionSet.length > 0 ? (
              <SuggestionReviewDialog
                customerName={detail.customer.name}
                suggestions={detail.suggestionSet}
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
        <Alert className="rounded-xl border-rose-200 bg-white text-slate-700 shadow-sm">
          <AlertTriangleIcon className="text-rose-600" />
          <AlertTitle className="text-slate-950">연결 상태 확인 필요</AlertTitle>
          <AlertDescription>
            {blockedConnections.map((connection) => connection.syncHeadline).join(" / ")}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="고객 상태" eyebrow="Overview">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.customer.statusTag} />
            <span className="text-sm text-slate-500">
              {detail.customer.segment} · 담당 {detail.customer.primaryManager}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                열린 이슈
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {detail.openIssues.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                승인 대기
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {
                  detail.suggestionSet.filter(
                    (suggestion) => suggestion.approvalStatus === "pending",
                  ).length
                }
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                마지막 액션
              </div>
              <div className="mt-2 text-sm font-medium text-slate-950">
                {formatRelativeTime(detail.customer.lastActionAt)}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="채널 연결 상태" eyebrow="Connections">
          <div className="flex flex-col gap-3">
            {detail.connections.map((connection) => (
              <div
                key={connection.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ChannelBadge channel={connection.channelType} />
                    <span className="text-sm text-slate-500">
                      {connection.externalPropertyRef ?? connection.externalAccountRef}
                    </span>
                  </div>
                  <StatusBadge value={connection.connectionStatus} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {connection.syncHeadline}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="border border-slate-200 bg-white">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="signals">채널 신호</TabsTrigger>
          <TabsTrigger value="activity">작업 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="열린 이슈" eyebrow="Issues">
              <div className="flex flex-col gap-4">
                {detail.openIssues.map((issue, index) => (
                  <div key={issue.id}>
                    {index > 0 ? <Separator className="mb-4 bg-slate-200" /> : null}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={issue.severity} />
                        <span className="font-medium text-slate-950">{issue.title}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{issue.summary}</p>
                      <p className="text-sm text-slate-500">
                        권장 액션: {issue.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="내부 메모" eyebrow="Notes">
              <div className="flex flex-col gap-4">
                {detail.memos.map((memo, index) => (
                  <div key={memo.id}>
                    {index > 0 ? <Separator className="mb-4 bg-slate-200" /> : null}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge value="low" label={memo.memoType} />
                        <span className="text-sm text-slate-500">
                          {memo.createdBy} · {formatRelativeTime(memo.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{memo.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {detail.insights.map((insight) => (
              <SectionCard
                key={insight.id}
                eyebrow={insight.freshnessLabel}
                title={insight.headline}
                description={insight.note}
                action={<ChannelBadge channel={insight.channelType} />}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {insight.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {metric.label}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-950">
                        {metric.value}
                      </div>
                      {metric.delta ? (
                        <div className="mt-1 text-xs text-slate-500">{metric.delta}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <SectionCard title="최근 작업 이력" eyebrow="Activity">
            <div className="flex flex-col gap-4">
              {detail.logs.map((log, index) => (
                <div key={log.id}>
                  {index > 0 ? <Separator className="mb-4 bg-slate-200" /> : null}
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
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
                      <p className="mt-2 text-sm text-slate-500">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
