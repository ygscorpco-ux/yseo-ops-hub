"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IssueQueueEntry } from "@/lib/yseo/selectors";
import { formatRelativeTime } from "@/lib/utils";

export function IssueQueueView({ entries }: { entries: IssueQueueEntry[] }) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
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

      return searchMatch && severityMatch;
    });
  }, [deferredSearch, entries, severityFilter]);

  return (
    <SectionCard
      eyebrow="Action queue"
      title="이슈와 승인 대기 작업"
      description="고객이 아니라 작업 기준으로 정렬합니다. 치명도와 감지 시각 기준으로 처리 순서를 빠르게 잡을 수 있습니다."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="이슈 제목, 고객명, 요약으로 찾기"
                className="border-slate-300 bg-white pl-9"
              />
            </div>

            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full border-slate-300 bg-white sm:w-40">
                <SelectValue placeholder="치명도" />
              </SelectTrigger>
              <SelectContent className="border border-slate-200 bg-white">
                <SelectGroup>
                  <SelectItem value="all">전체 치명도</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-slate-500">
            현재 {filteredEntries.length}건이 작업 큐에 남아 있습니다.
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 이슈가 없습니다."
            description="검색어나 치명도 필터를 바꾸면 바로 다시 볼 수 있습니다."
          />
        ) : (
          <Table className="rounded-xl border border-slate-200 bg-white">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="px-4 text-slate-500">치명도</TableHead>
                <TableHead className="text-slate-500">고객</TableHead>
                <TableHead className="text-slate-500">채널</TableHead>
                <TableHead className="text-slate-500">이슈</TableHead>
                <TableHead className="text-slate-500">권장 액션</TableHead>
                <TableHead className="text-slate-500">감지 시각</TableHead>
                <TableHead className="px-4 text-right text-slate-500">처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.issue.id} className="hover:bg-slate-50">
                  <TableCell className="px-4">
                    <StatusBadge value={entry.issue.severity} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className="font-medium text-slate-950 hover:text-slate-700"
                      >
                        {entry.customer.name}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {entry.customer.statusTag}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={entry.issue.channelType} />
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal">
                    <div className="space-y-1">
                      <div className="font-medium text-slate-950">{entry.issue.title}</div>
                      <p className="text-sm text-slate-600">{entry.issue.summary}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-sm text-slate-600">
                    {entry.issue.recommendedAction}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatRelativeTime(entry.issue.detectedAt)}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        상세
                        <ArrowUpRightIcon data-icon="inline-end" />
                      </Link>
                      {entry.suggestionSet.length > 0 ? (
                        <SuggestionReviewDialog
                          customerName={entry.customer.name}
                          suggestions={entry.suggestionSet}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </SectionCard>
  );
}
