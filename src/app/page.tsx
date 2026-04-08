import Link from "next/link";
import { FileTextIcon, TriangleAlertIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardView } from "@/lib/yseo/selectors";
import {
  compactSecondaryActionClass,
  primaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export default async function HomePage() {
  const dashboard = await getDashboardView();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="운영 허브"
        title="오늘 바로 처리할 고객과 작업만 보여줍니다"
        description="YSEO는 정상 고객을 길게 펼쳐 보여주는 분석 도구가 아닙니다. 예외 고객, 연결 이상, 승인 대기 작업을 먼저 모아 운영 속도를 높이는 액션 허브입니다."
        actions={
          <>
            <Link href="/customers" className={secondaryActionClass}>
              고객 리스트
            </Link>
            <Link href="/issues" className={primaryActionClass}>
              작업 큐 열기
            </Link>
          </>
        }
      />

      <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">
              오늘 우선순위
            </div>
            <h2 className="text-base font-semibold tracking-tight text-slate-950">
              처리 필요 고객 {dashboard.metrics[0]?.value}곳, 긴급 이슈 {dashboard.metrics[1]?.value}
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              연결 이상과 승인 대기 제안을 먼저 보고, 필요할 때만 고객 상세로 내려가는 흐름에 맞춰 정리했습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/issues" className={compactSecondaryActionClass}>
              작업 우선순위 보기
            </Link>
            <Link href="/reports" className={compactSecondaryActionClass}>
              리포트 초안 보기
            </Link>
          </div>
        </div>
      </section>

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

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow="우선 고객"
          title="먼저 볼 고객"
          description="상태 태그, 최근 이슈, 마지막 동기화 시각을 기준으로 오늘 손댈 고객만 앞으로 끌어냅니다."
        >
          {dashboard.focusCustomers.length === 0 ? (
            <p className="text-sm text-slate-600">지금 바로 확인이 필요한 고객이 없습니다.</p>
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

        <div className="space-y-4">
          <SectionCard
            eyebrow="연결 점검"
            title="연결 상태 확인"
            description="권한 문제, 토큰 만료, 동기화 실패 고객을 먼저 모아 확인합니다."
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
            eyebrow="승인 대기"
            title="승인 대기 제안"
            description="바로 실행하지 않고 운영자 검토가 필요한 제안만 따로 모아 둡니다."
          >
            <div className="space-y-3">
              {dashboard.pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">{suggestion.customerName}</div>
                      <div className="text-sm leading-6 text-slate-600">{suggestion.title}</div>
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
          eyebrow="상단 이슈"
          title="상단 이슈"
          action={
            <div className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <TriangleAlertIcon className="size-4" />
              처리 우선순위 순
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

        <SectionCard
          eyebrow="최근 초안"
          title="최근 리포트 초안"
          action={
            <div className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <FileTextIcon className="size-4" />
              자동 초안 기준
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
