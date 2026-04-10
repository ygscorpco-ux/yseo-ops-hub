import Link from "next/link";

import { ChannelBadge } from "@/components/channel-badge";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { listCustomerEntries } from "@/lib/yseo/selectors";
import { compactSecondaryActionClass, secondaryActionClass } from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const entries = await listCustomerEntries();

  const attentionCustomers = entries.filter(
    (entry) =>
      entry.openIssues.length > 0 ||
      entry.connections.some((connection) => connection.connectionStatus !== "connected"),
  );

  const naverConnected = entries.filter((entry) =>
    entry.connections.some(
      (connection) =>
        connection.channelType === "naver-searchad" &&
        connection.connectionStatus === "connected",
    ),
  ).length;

  const searchConsoleConnected = entries.filter((entry) =>
    entry.connections.some(
      (connection) =>
        connection.channelType === "search-console" &&
        connection.connectionStatus === "connected",
    ),
  ).length;

  const connectionWatchlist = entries.flatMap((entry) =>
    entry.connections
      .filter((connection) => connection.connectionStatus !== "connected")
      .map((connection) => ({
        customerId: entry.customer.id,
        customerName: entry.customer.name,
        connection,
      })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="채널 상태"
        title="네이버 · 구글 현재 상태"
        description="고객별 채널 연결 상태와 지금 확인이 필요한 고객만 빠르게 훑는 종합 상태판입니다."
        actions={
          <Link href="/customers" className={secondaryActionClass}>
            고객 보기
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 고객"
          value={String(entries.length)}
          helper="연결된 고객 상태를 한 화면에서 확인합니다."
        />
        <MetricCard
          label="주의 고객"
          value={String(attentionCustomers.length)}
          helper="오류, 경고, 연결 확인이 필요한 고객 수입니다."
          className="border-amber-200"
        />
        <MetricCard
          label="네이버 연결"
          value={String(naverConnected)}
          helper="정상 연결된 네이버 검색광고 고객 수입니다."
          className="border-sky-200"
        />
        <MetricCard
          label="Search Console 연결"
          value={String(searchConsoleConnected)}
          helper="정상 연결된 Search Console 고객 수입니다."
          className="border-emerald-200"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          eyebrow="주의 고객"
          title="먼저 확인할 고객"
          className="overflow-hidden"
          bodyClassName="p-0"
          action={
            <Link href="/customers" className={compactSecondaryActionClass}>
              전체 고객
            </Link>
          }
        >
          {attentionCustomers.length === 0 ? (
            <div className="px-4 py-3.5">
              <p className="text-sm leading-6 text-slate-600">
                지금 바로 확인할 고객이 없습니다.
              </p>
            </div>
          ) : (
            <div className="max-h-[34rem] overflow-y-auto px-4 py-3 xl:max-h-[42rem]">
              <div className="space-y-1">
                {attentionCustomers.map((entry, index) => (
                  <div
                    key={entry.customer.id}
                    className={index > 0 ? "border-t border-slate-200 pt-3" : ""}
                  >
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/customers/${entry.customer.id}`}
                            className="text-[15px] font-semibold tracking-tight text-slate-950 hover:text-slate-700"
                          >
                            {entry.customer.name}
                          </Link>
                          <StatusBadge value={entry.customer.statusTag} />
                          {entry.connections.map((connection) => (
                            <ChannelBadge key={connection.id} channel={connection.channelType} />
                          ))}
                        </div>
                        <p className="max-w-2xl text-sm leading-5 text-slate-600">
                          {entry.summaryLine}
                        </p>
                        <div className="flex flex-wrap gap-2.5 text-[11px] leading-5 text-slate-500">
                          <span>열린 경고 {entry.openIssues.length}건</span>
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
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="연결 상태"
          title="채널 연결 확인"
          className="overflow-hidden"
          bodyClassName="p-0"
        >
          {connectionWatchlist.length === 0 ? (
            <div className="px-4 py-3.5">
              <p className="text-sm leading-6 text-slate-600">
                현재 연결 확인이 필요한 채널이 없습니다.
              </p>
            </div>
          ) : (
            <div className="max-h-[34rem] overflow-y-auto px-4 py-3 xl:max-h-[42rem]">
              <div className="space-y-2.5">
                {connectionWatchlist.map(({ customerId, customerName, connection }) => (
                  <div
                    key={connection.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Link
                          href={`/customers/${customerId}`}
                          className="text-[15px] font-medium text-slate-950 hover:text-slate-700"
                        >
                          {customerName}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <ChannelBadge channel={connection.channelType} />
                          <span className="text-[11px] leading-5 text-slate-500">
                            {connection.externalPropertyRef ?? connection.externalAccountRef}
                          </span>
                        </div>
                        <p className="text-sm leading-5 text-slate-600">
                          {connection.syncHeadline}
                        </p>
                      </div>
                      <StatusBadge value={connection.connectionStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
