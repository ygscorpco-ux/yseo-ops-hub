"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
import type { IssueQueueEntry } from "@/lib/yseo/selectors";
import { compactSecondaryActionClass, fieldClass } from "@/lib/yseo/ui";
import { formatRelativeTime } from "@/lib/utils";

type IssueCategory = "all" | "sync" | "performance" | "other";

function getIssueCategory(issueType: string): Exclude<IssueCategory, "all"> {
  if (issueType.includes("sync")) {
    return "sync";
  }

  if (issueType.includes("conversion") || issueType.includes("click")) {
    return "performance";
  }

  return "other";
}

function getIssueTypeLabel(issueType: string) {
  switch (issueType) {
    case "sync-blocked":
      return "동기화 실패";
    case "conversion-drop":
      return "전환 급감";
    case "click-drop":
      return "클릭 급감";
    case "no-conversion":
      return "무전환";
    default:
      return issueType;
  }
}

function getIssueTypeTone(issueType: string) {
  const category = getIssueCategory(issueType);

  if (category === "sync") {
    return "rose" as const;
  }

  if (category === "performance") {
    return "amber" as const;
  }

  return "slate" as const;
}

export function IssueQueueView({ entries }: { entries: IssueQueueEntry[] }) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory>("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const searchMatch =
        deferredSearch.length === 0 ||
        entry.customer.name.toLowerCase().includes(deferredSearch) ||
        entry.issue.title.toLowerCase().includes(deferredSearch) ||
        entry.issue.summary.toLowerCase().includes(deferredSearch);
      const severityMatch =
        severityFilter === "all" || entry.issue.severity === severityFilter;
      const categoryMatch =
        categoryFilter === "all" ||
        getIssueCategory(entry.issue.issueType) === categoryFilter;

      return searchMatch && severityMatch && categoryMatch;
    });
  }, [categoryFilter, deferredSearch, entries, severityFilter]);

  const syncBlockerCount = entries.filter(
    (entry) => entry.issue.issueType === "sync-blocked",
  ).length;
  const performanceIssueCount = entries.filter(
    (entry) => getIssueCategory(entry.issue.issueType) === "performance",
  ).length;

  return (
    <SectionCard
      eyebrow="작업 큐"
      title="이슈와 승인 대기 작업"
      description="치명도와 감지 시각 기준으로 먼저 확인할 작업부터 빠르게 처리할 수 있게 묶었습니다."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StateChip label={`전체 ${entries.length}`} tone="slate" />
          <StateChip label={`동기화 실패 ${syncBlockerCount}`} tone="rose" />
          <StateChip label={`성과 이슈 ${performanceIssueCount}`} tone="amber" />
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
              placeholder="이슈 제목, 고객명, 요약으로 찾기"
              className={`${fieldClass} w-full pl-9`}
            />
          </label>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className={fieldClass}
          >
            <option value="all">전체 심각도</option>
            <option value="critical">긴급</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as IssueCategory)
            }
            className={fieldClass}
          >
            <option value="all">전체 유형</option>
            <option value="sync">동기화 실패</option>
            <option value="performance">성과 이슈</option>
            <option value="other">기타</option>
          </select>

          <div className="flex items-center justify-end text-sm text-slate-500">
            {filteredEntries.length}개 작업
          </div>
        </form>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 작업이 없습니다"
            description="검색어나 필터를 바꾸면 다시 바로 확인할 수 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">심각도</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">고객</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">채널</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">이슈</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">권장 액션</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">감지 시각</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    처리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.issue.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <StatusBadge value={entry.issue.severity} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="space-y-1">
                        <Link
                          href={`/customers/${entry.customer.id}`}
                          className="font-medium text-slate-950 hover:text-slate-700"
                        >
                          {entry.customer.name}
                        </Link>
                        <div className="text-xs leading-5 text-slate-500">
                          {entry.customer.statusTag}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <ChannelBadge channel={entry.issue.channelType} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="max-w-sm space-y-1 whitespace-normal">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-slate-950">
                            {entry.issue.title}
                          </div>
                          <StateChip
                            label={getIssueTypeLabel(entry.issue.issueType)}
                            tone={getIssueTypeTone(entry.issue.issueType)}
                          />
                        </div>
                        <p className="text-slate-600">{entry.issue.summary}</p>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-600">
                      <div className="max-w-sm whitespace-normal">
                        {entry.issue.recommendedAction}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-500">
                      {formatRelativeTime(entry.issue.detectedAt)}
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
                        {entry.suggestionSet.length > 0 ? (
                          <SuggestionReviewDialog
                            customerName={entry.customer.name}
                            suggestions={entry.suggestionSet}
                          />
                        ) : null}
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
