"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
import type { CustomerListEntry } from "@/lib/yseo/selectors";
import {
  compactSecondaryActionClass,
  fieldClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export function CustomerListView({ entries }: { entries: CustomerListEntry[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const searchMatch =
        deferredSearch.length === 0 ||
        entry.customer.name.toLowerCase().includes(deferredSearch) ||
        entry.summaryLine.toLowerCase().includes(deferredSearch);
      const statusMatch =
        statusFilter === "all" || entry.customer.statusTag === statusFilter;
      const channelMatch =
        channelFilter === "all" ||
        entry.connections.some((connection) => connection.channelType === channelFilter);

      return searchMatch && statusMatch && channelMatch;
    });
  }, [channelFilter, deferredSearch, entries, statusFilter]);

  return (
    <SectionCard
      eyebrow="CUSTOMER SCAN"
      title="우선순위 고객 스캔"
      description="검색, 상태 태그, 채널 기준으로 고객을 빠르게 걸러 보고 바로 상세나 제안 검토로 이동할 수 있습니다."
    >
      <div className="space-y-5">
        <form
          className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="고객명 또는 요약으로 찾기"
              className={`${fieldClass} w-full pl-9`}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={fieldClass}
          >
            <option value="all">전체 상태</option>
            <option value="긴급 조치">긴급 조치</option>
            <option value="오늘 확인">오늘 확인</option>
            <option value="관찰">관찰</option>
            <option value="정상">정상</option>
          </select>

          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className={fieldClass}
          >
            <option value="all">전체 채널</option>
            <option value="naver-searchad">네이버 검색광고</option>
            <option value="search-console">Search Console</option>
            <option value="business-profile">Business Profile</option>
          </select>

          <div className="flex items-center justify-end text-sm text-slate-500">
            {filteredEntries.length}개 고객
          </div>
        </form>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 고객이 없습니다"
            description="검색어나 필터를 바꾸면 다시 바로 볼 수 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">고객</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">상태</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">채널</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">최근 7일 요약</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">이슈</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">제안</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">마지막 동기화</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    바로 처리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.customer.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="space-y-1">
                        <Link
                          href={`/customers/${entry.customer.id}`}
                          className="font-medium text-slate-950 hover:text-slate-700"
                        >
                          {entry.customer.name}
                        </Link>
                        <div className="text-xs leading-5 text-slate-500">
                          {entry.customer.segment} · 담당 {entry.customer.primaryManager}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <StatusBadge value={entry.customer.statusTag} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {entry.connections.map((connection) => (
                          <ChannelBadge key={connection.id} channel={connection.channelType} />
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-600">
                      <div className="max-w-sm whitespace-normal">{entry.summaryLine}</div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      {entry.openIssues.length}건
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      {entry.pendingSuggestions.length}건
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-500">
                      {formatRelativeTime(entry.lastSyncAt)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/customers/${entry.customer.id}`}
                          className={`${compactSecondaryActionClass} rounded-md px-2.5 py-1.5 text-xs`}
                        >
                          상세
                          <ArrowUpRightIcon className="ml-1 inline size-3.5" />
                        </Link>
                        {entry.pendingSuggestions.length > 0 ? (
                          <SuggestionReviewDialog
                            customerName={entry.customer.name}
                            suggestions={entry.pendingSuggestions}
                            triggerLabel={`제안 ${entry.pendingSuggestions.length}건`}
                          />
                        ) : null}
                        {entry.latestReport ? (
                          <ReportPreviewDialog
                            customerName={entry.customer.name}
                            report={entry.latestReport}
                          />
                        ) : (
                          <span className={secondaryActionClass}>초안 없음</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
