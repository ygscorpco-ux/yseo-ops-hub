"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { StatusBadge } from "@/components/status-badge";
import type { CustomerListEntry } from "@/lib/yseo/selectors";
import { compactSecondaryActionClass, fieldClass } from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

export function CustomerListView({ entries }: { entries: CustomerListEntry[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const statusOptions = useMemo(
    () => ["all", ...new Set(entries.map((entry) => entry.customer.statusTag))],
    [entries],
  );

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

  const withAlerts = entries.filter((entry) => entry.openIssues.length > 0).length;
  const withSearchConsole = entries.filter((entry) =>
    entry.connections.some((connection) => connection.channelType === "search-console"),
  ).length;

  return (
    <SectionCard
      eyebrow="고객 목록"
      title="채널 연결 고객"
      description="고객 기본 정보가 아니라 채널 연결 상태와 최근 상태만 모아서 봅니다."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StateChip label={`전체 ${entries.length}`} tone="slate" />
          <StateChip label={`주의 ${withAlerts}`} tone="amber" />
          <StateChip label={`Search Console ${withSearchConsole}`} tone="sky" />
        </div>

        <form
          className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="상호나 최근 상태로 찾기"
              className={`${fieldClass} w-full pl-9`}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={fieldClass}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "전체 상태" : option}
              </option>
            ))}
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
            description="검색어나 필터를 바꾸면 다시 바로 확인할 수 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">고객</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">현재 상태</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">채널</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">최근 상태</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">마지막 동기화</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.customer.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className="font-medium text-slate-950 hover:text-slate-700"
                      >
                        {entry.customer.name}
                      </Link>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={entry.customer.statusTag} />
                        {entry.openIssues.length > 0 ? (
                          <StateChip label={`경고 ${entry.openIssues.length}`} tone="amber" />
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {entry.connections.length > 0 ? (
                          entry.connections.map((connection) => (
                            <ChannelBadge key={connection.id} channel={connection.channelType} />
                          ))
                        ) : (
                          <StateChip label="미연결" tone="slate" />
                        )}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-600">
                      <div className="max-w-sm whitespace-normal">{entry.summaryLine}</div>
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
                          상세 보기
                          <ArrowUpRightIcon className="ml-1 inline size-3.5" />
                        </Link>
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
