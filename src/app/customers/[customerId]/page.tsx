import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangleIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Customer Detail"
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
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>연결 상태 확인 필요</AlertTitle>
          <AlertDescription>
            {blockedConnections
              .map((connection) => connection.syncHeadline)
              .join(" / ")}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-border/70 bg-muted/15 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.customer.statusTag} />
            <span className="text-sm text-muted-foreground">
              {detail.customer.segment} · 담당 {detail.customer.primaryManager}
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                열린 이슈
              </div>
              <div className="mt-2 text-3xl font-semibold">
                {detail.openIssues.length}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                승인 대기 제안
              </div>
              <div className="mt-2 text-3xl font-semibold">
                {
                  detail.suggestionSet.filter(
                    (suggestion) => suggestion.approvalStatus === "pending",
                  ).length
                }
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                마지막 액션
              </div>
              <div className="mt-2 text-sm font-medium">
                {formatRelativeTime(detail.customer.lastActionAt)}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-background p-5">
          <h3 className="text-lg font-semibold">채널 연결 상태</h3>
          <div className="mt-4 flex flex-col gap-3">
            {detail.connections.map((connection) => (
              <div
                key={connection.id}
                className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ChannelBadge channel={connection.channelType} />
                    <span className="text-sm text-muted-foreground">
                      {connection.externalPropertyRef ?? connection.externalAccountRef}
                    </span>
                  </div>
                  <StatusBadge value={connection.connectionStatus} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {connection.syncHeadline}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="signals">채널 신호</TabsTrigger>
          <TabsTrigger value="activity">작업 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-[28px] border border-border/70 bg-background p-5">
              <h3 className="text-lg font-semibold">열린 이슈</h3>
              <div className="mt-4 flex flex-col gap-4">
                {detail.openIssues.map((issue, index) => (
                  <div key={issue.id}>
                    {index > 0 ? <Separator className="mb-4" /> : null}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={issue.severity} />
                        <span className="font-medium">{issue.title}</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {issue.summary}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        권장 액션: {issue.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-border/70 bg-background p-5">
              <h3 className="text-lg font-semibold">내부 메모</h3>
              <div className="mt-4 flex flex-col gap-4">
                {detail.memos.map((memo, index) => (
                  <div key={memo.id}>
                    {index > 0 ? <Separator className="mb-4" /> : null}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge value="low" label={memo.memoType} />
                        <span className="text-sm text-muted-foreground">
                          {memo.createdBy} · {formatRelativeTime(memo.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {memo.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            {detail.insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-[28px] border border-border/70 bg-background p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <ChannelBadge channel={insight.channelType} />
                  <div className="text-sm text-muted-foreground">
                    {insight.freshnessLabel}
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{insight.headline}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {insight.note}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {insight.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {metric.label}
                      </div>
                      <div className="mt-1 text-lg font-semibold">{metric.value}</div>
                      {metric.delta ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {metric.delta}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <section className="rounded-[28px] border border-border/70 bg-background p-5">
            <h3 className="text-lg font-semibold">최근 작업 이력</h3>
            <div className="mt-4 flex flex-col gap-4">
              {detail.logs.map((log, index) => (
                <div key={log.id}>
                  {index > 0 ? <Separator className="mb-4" /> : null}
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
                        <span className="font-medium">{log.summary}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {log.actorName} · {log.actionType}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelativeTime(log.executedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
