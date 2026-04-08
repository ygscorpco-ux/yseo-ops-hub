import Link from "next/link";
import { ArrowRightIcon, Link2OffIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react";

import { MetricTile } from "@/components/metric-tile";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDashboardView } from "@/lib/yseo/selectors";
import { channelLabels } from "@/lib/yseo/types";
import { formatRelativeTime } from "@/lib/utils";

export default function HomePage() {
  const dashboard = getDashboardView();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Operations First"
        title="오늘 손댈 고객과 작업만 남긴 운영 허브"
        description="YSEO는 정상 고객을 길게 보여주는 분석기가 아니라, 지금 판단하고 승인해야 할 고객·이슈·초안만 앞으로 끌어오는 운영 화면입니다."
        actions={
          <>
            <Link
              href="/customers"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              고객 리스트
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link href="/issues" className={buttonVariants({ size: "sm" })}>
              작업 큐 열기
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboard.metrics.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-border/70 bg-muted/15 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">오늘 바로 볼 고객</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                상태 태그와 열린 이슈를 기준으로 우선순위 고객만 정렬했습니다.
              </p>
            </div>
            <StatusBadge value="critical" label={`${dashboard.focusCustomers.length}개 노출`} />
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {dashboard.focusCustomers.map((entry, index) => (
              <div key={entry.customer.id}>
                {index > 0 ? <Separator className="mb-4" /> : null}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className="text-base font-semibold hover:text-primary"
                      >
                        {entry.customer.name}
                      </Link>
                      <StatusBadge value={entry.customer.statusTag} />
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {entry.summaryLine}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>이슈 {entry.openIssues.length}건</span>
                      <span>·</span>
                      <span>승인 대기 {entry.pendingSuggestions.length}건</span>
                      <span>·</span>
                      <span>마지막 sync {formatRelativeTime(entry.lastSyncAt)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/customers/${entry.customer.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    열기
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-[28px] border border-border/70 bg-background p-5">
            <div className="flex items-center gap-2">
              <Link2OffIcon className="size-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">연결 상태 주시 목록</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {dashboard.connectionWatchlist.map((connection) => (
                <div
                  key={connection.id}
                  className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{connection.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {channelLabels[connection.channelType]}
                      </div>
                    </div>
                    <StatusBadge value={connection.connectionStatus} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {connection.syncHeadline}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-border/70 bg-background p-5">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">승인 대기 제안</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {dashboard.pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{suggestion.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.title}
                      </div>
                    </div>
                    <StatusBadge value={suggestion.approvalStatus} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-border/70 bg-background p-5">
          <div className="flex items-center gap-2">
            <TriangleAlertIcon className="size-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">작업 큐 상단 이슈</h3>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.queueEntries.map((entry) => (
              <div
                key={entry.issue.id}
                className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={entry.issue.severity} />
                  <Link
                    href={`/customers/${entry.customer.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {entry.customer.name}
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {entry.issue.title}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-background p-5">
          <h3 className="text-lg font-semibold">최근 리포트 초안</h3>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.reports.map((entry) => (
              <div
                key={entry.report.id}
                className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{entry.customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.report.title}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(entry.report.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
