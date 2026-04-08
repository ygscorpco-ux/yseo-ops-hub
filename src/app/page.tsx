import Link from "next/link";
import {
  ArrowRightIcon,
  FileTextIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { MetricTile } from "@/components/metric-tile";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDashboardView } from "@/lib/yseo/selectors";
import { channelLabels } from "@/lib/yseo/types";
import { formatRelativeTime } from "@/lib/utils";

export default async function HomePage() {
  const dashboard = await getDashboardView();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations first"
        title="오늘 손댈 고객과 작업만 먼저 봅니다."
        description="YSEO는 정상 고객을 길게 보여주는 분석기가 아니라, 지금 처리해야 할 고객과 승인 대기 작업을 먼저 모아 보여주는 운영 허브입니다."
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

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow="Focus customers"
          title="오늘 먼저 볼 고객"
          description="상태 태그, 열린 이슈, 최근 sync 상태를 기준으로 우선순위 고객만 앞으로 올렸습니다."
        >
          <div className="flex flex-col gap-4">
            {dashboard.focusCustomers.map((entry, index) => (
              <div key={entry.customer.id}>
                {index > 0 ? <Separator className="mb-4 bg-slate-200" /> : null}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className="text-base font-semibold text-slate-950 hover:text-slate-700"
                      >
                        {entry.customer.name}
                      </Link>
                      <StatusBadge value={entry.customer.statusTag} />
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      {entry.summaryLine}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
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
                    상세 보기
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard
            eyebrow="Connection watch"
            title="연결 상태 확인"
            action={<Link href="/issues" className={buttonVariants({ variant: "outline", size: "sm" })}>작업 큐</Link>}
          >
            <div className="flex flex-col gap-3">
              {dashboard.connectionWatchlist.map((connection) => (
                <div
                  key={connection.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">{connection.customerName}</div>
                      <div className="text-sm text-slate-500">
                        {channelLabels[connection.channelType]}
                      </div>
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

          <SectionCard eyebrow="Pending" title="승인 대기 제안">
            <div className="flex flex-col gap-3">
              {dashboard.pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">
                        {suggestion.customerName}
                      </div>
                      <div className="text-sm text-slate-500">{suggestion.title}</div>
                    </div>
                    <StatusBadge value={suggestion.approvalStatus} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          eyebrow="Issue queue"
          title="상단 이슈"
          action={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TriangleAlertIcon className="size-4" />
              처리 순서대로 정렬
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {dashboard.queueEntries.map((entry) => (
              <div
                key={entry.issue.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={entry.issue.severity} />
                  <Link
                    href={`/customers/${entry.customer.id}`}
                    className="font-medium text-slate-950 hover:text-slate-700"
                  >
                    {entry.customer.name}
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {entry.issue.title}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Drafts"
          title="최근 리포트 초안"
          action={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileTextIcon className="size-4" />
              자동 초안 기준
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {dashboard.reports.map((entry) => (
              <div
                key={entry.report.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-950">{entry.customer.name}</div>
                    <div className="text-sm text-slate-500">{entry.report.title}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatRelativeTime(entry.report.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
