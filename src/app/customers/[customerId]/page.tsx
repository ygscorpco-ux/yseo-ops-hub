import Link from "next/link";
import { notFound } from "next/navigation";

import { ChannelBadge } from "@/components/channel-badge";
import { CustomerConnectionEditor } from "@/components/customer-connection-editor";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { isGoogleOAuthConfigured } from "@/lib/yseo/google-search-console";
import { getCustomerDetailView } from "@/lib/yseo/selectors";
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
  const detail = await getCustomerDetailView(customerId);

  if (!detail) {
    notFound();
  }

  const blockedConnections = detail.connections.filter(
    (connection) => connection.connectionStatus !== "connected",
  );
  const naverConnection = detail.connections.find(
    (connection) => connection.channelType === "naver-searchad",
  );
  const searchConsoleConnection = detail.connections.find(
    (connection) => connection.channelType === "search-console",
  );
  const googleOAuthConfigured = isGoogleOAuthConfigured();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="고객 상세"
        title={detail.customer.name}
        description="이 고객의 네이버·구글 연결 상태와 최근 상태만 봅니다."
        actions={
          <Link href="/customers" className={secondaryActionClass}>
            고객 목록으로
          </Link>
        }
      />

      {googleConnected === "search-console" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
              SEARCH CONSOLE 연결 완료
            </div>
            <p className="text-sm leading-6 text-slate-700">
              property 연결과 최근 7일 검증 수집을 마쳤습니다.
            </p>
          </div>
        </section>
      ) : null}

      {googleOAuthError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
              GOOGLE 연결 오류
            </div>
            <p className="text-sm leading-6 text-slate-700">{googleOAuthError}</p>
          </div>
        </section>
      ) : null}

      {blockedConnections.length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
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
                {detail.connections.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                현재 경고
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                {detail.openIssues.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                최근 동기화
              </div>
              <div className="mt-1.5 text-sm font-medium text-slate-950">
                {formatRelativeTime(
                  detail.connections
                    .map((connection) => connection.lastSyncAt)
                    .sort()
                    .reverse()[0] ?? detail.customer.lastActionAt,
                )}
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
            {detail.connections.length > 0 ? (
              detail.connections.map((connection) => (
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
                아직 연결된 채널이 없습니다. 오른쪽 상단에서 네이버 또는 Search Console을
                먼저 붙여 주세요.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="현재 경고" title="확인할 상태">
          {detail.openIssues.length === 0 ? (
            <p className="text-sm leading-6 text-slate-600">
              현재 열린 경고가 없습니다.
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
