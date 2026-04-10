import Link from "next/link";

import { ChannelBadge } from "@/components/channel-badge";
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="상태 대시보드"
        title="먼저 확인할 고객"
        description="네이버와 구글 채널 상태를 기준으로 지금 바로 봐야 할 고객만 모아둔 화면입니다."
        actions={
          <Link href="/customers" className={secondaryActionClass}>
            전체 고객 보기
          </Link>
        }
      />

      <SectionCard
        eyebrow="주의 고객"
        title={`현재 확인 필요 ${attentionCustomers.length}개`}
        className="overflow-hidden"
        bodyClassName="p-0"
      >
        {attentionCustomers.length === 0 ? (
          <div className="px-4 py-3.5">
            <p className="text-sm leading-6 text-slate-600">
              지금 바로 확인할 고객이 없습니다.
            </p>
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto px-4 py-3 xl:max-h-[36rem]">
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
    </div>
  );
}
