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
import { Button, buttonVariants } from "@/components/ui/button";
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
import type { CustomerListEntry } from "@/lib/yseo/selectors";
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
      eyebrow="Customer scan"
      title="고객 우선순위 스캔"
      description="검색, 상태 태그, 채널 기준으로 고객을 빠르게 걸러보고 바로 상세나 제안 검토로 내려갈 수 있습니다."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="고객명이나 요약으로 빠르게 찾기"
                className="w-full border-slate-300 bg-white pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full border-slate-300 bg-white sm:w-40">
                <SelectValue placeholder="상태 태그" />
              </SelectTrigger>
              <SelectContent className="border border-slate-200 bg-white">
                <SelectGroup>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="긴급 조치">긴급 조치</SelectItem>
                  <SelectItem value="오늘 확인">오늘 확인</SelectItem>
                  <SelectItem value="관찰">관찰</SelectItem>
                  <SelectItem value="정상">정상</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={channelFilter}
              onValueChange={(value) => setChannelFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full border-slate-300 bg-white sm:w-48">
                <SelectValue placeholder="채널" />
              </SelectTrigger>
              <SelectContent className="border border-slate-200 bg-white">
                <SelectGroup>
                  <SelectItem value="all">전체 채널</SelectItem>
                  <SelectItem value="naver-searchad">네이버 검색광고</SelectItem>
                  <SelectItem value="search-console">Search Console</SelectItem>
                  <SelectItem value="business-profile">Business Profile</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-slate-500">
            현재 {filteredEntries.length}개 고객이 조건에 맞습니다.
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 고객이 없습니다."
            description="검색어나 필터를 바꾸면 다시 바로 볼 수 있습니다."
          />
        ) : (
          <Table className="rounded-xl border border-slate-200 bg-white">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="px-4 text-slate-500">고객</TableHead>
                <TableHead className="text-slate-500">상태</TableHead>
                <TableHead className="text-slate-500">채널</TableHead>
                <TableHead className="text-slate-500">최근 7일 요약</TableHead>
                <TableHead className="text-slate-500">이슈</TableHead>
                <TableHead className="text-slate-500">제안</TableHead>
                <TableHead className="text-slate-500">마지막 sync</TableHead>
                <TableHead className="px-4 text-right text-slate-500">바로 처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.customer.id} className="hover:bg-slate-50">
                  <TableCell className="px-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/customers/${entry.customer.id}`}
                        className="font-medium text-slate-950 hover:text-slate-700"
                      >
                        {entry.customer.name}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {entry.customer.segment} · 담당 {entry.customer.primaryManager}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={entry.customer.statusTag} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {entry.connections.map((connection) => (
                        <ChannelBadge key={connection.id} channel={connection.channelType} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-sm text-slate-600">
                    {entry.summaryLine}
                  </TableCell>
                  <TableCell>{entry.openIssues.length}건</TableCell>
                  <TableCell>{entry.pendingSuggestions.length}건</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatRelativeTime(entry.lastSyncAt)}
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
                        <Button variant="outline" size="sm" disabled>
                          초안 없음
                        </Button>
                      )}
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
