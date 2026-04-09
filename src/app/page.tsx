import Link from "next/link";
import { FileTextIcon, TriangleAlertIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardView } from "@/lib/yseo/selectors";
import { compactSecondaryActionClass, secondaryActionClass } from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getDashboardView();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="운영 허브"
        title="오늘 처리할 고객과 작업"
        description="정상 고객보다 지금 손대야 할 항목을 먼저 봅니다."
        actions={
          <>
            <Link href="/customers" className={secondaryActionClass}>
              고객 리스트
            </Link>
            <Link href="/issues" className={secondaryActionClass}>
              작업 큐
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            className={
              metric.tone === "critical"
                ? "border-rose-200"
                : metric.tone === "warning"
                  ? "border-amber-200"
                  : metric.tone === "success"
                    ? "border-emerald-200"
                    : undefined
            }
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          eyebrow="우선 고객"
          title="먼저 볼 고객"
          action={
            <Link href="/customers" className={compactSecondaryActionClass}>
              전체 고객
            </Link>
          }
        >
          {dashboard.focusCustomers.length === 0 ? (
            <p className="text-sm text-slate-600">지금 바로 확인할 고객이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {dashboard.focusCustomers.map((entry, index) => (
                <div
                  key={entry.customer.id}
                  className={index > 0 ? "border-t border-slate-200 pt-4" : ""}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/customers/${entry.customer.id}`}
                          className="text-base font-semibold tracking-tight text-slate-950 hover:text-slate-700"
                        >
                          {entry.customer.name}
                        </Link>
                        <StatusBadge value={entry.customer.statusTag} />
                        {entry.connections[0] ? (
                          <ChannelBadge channel={entry.connections[0].channelType} />
                        ) : null}
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-slate-600">
                        {entry.summaryLine}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs leading-5 text-slate-500">
                        <span>이슈 {entry.openIssues.length}건</span>
                        <span>승인 대기 {entry.pendingSuggestions.length}건</span>
                        <span>마지막 동기화 {formatRelativeTime(entry.lastSyncAt)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/customers/${entry.customer.id}`}
                      className={compactSecondaryActionClass}
                    >
                      상세 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="작업 큐"
          title="상단 이슈"
          action={
            <div className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <TriangleAlertIcon className="size-4" />
              우선 처리 순서
            </div>
          }
        >
          <div className="space-y-3">
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
                  <ChannelBadge channel={entry.issue.channelType} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entry.issue.title}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          eyebrow="연결 상태"
          title="확인 필요한 연결"
          action={
            <Link href="/customers" className={compactSecondaryActionClass}>
              고객 상세
            </Link>
          }
        >
          <div className="space-y-3">
            {dashboard.connectionWatchlist.map((connection) => (
              <div
                key={connection.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-950">{connection.customerName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <ChannelBadge channel={connection.channelType} />
                      <span className="text-xs leading-5 text-slate-500">
                        {connection.externalPropertyRef ?? connection.externalAccountRef}
                      </span>
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

        <SectionCard
          eyebrow="리포트"
          title="최근 초안"
          action={
            <div className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <FileTextIcon className="size-4" />
              월말 발행 기준
            </div>
          }
        >
          <div className="space-y-3">
            {dashboard.reports.map((entry) => (
              <div
                key={entry.report.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-950">{entry.customer.name}</div>
                    <div className="text-sm leading-6 text-slate-600">{entry.report.title}</div>
                  </div>
                  <span className="text-xs leading-5 text-slate-500">
                    {formatRelativeTime(entry.report.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
