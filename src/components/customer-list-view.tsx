"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="고객명이나 이슈 요약으로 빠르게 찾기"
              className="w-full pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="상태 태그" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="긴급 조치">긴급 조치</SelectItem>
                <SelectItem value="오늘 점검">오늘 점검</SelectItem>
                <SelectItem value="관찰">관찰</SelectItem>
                <SelectItem value="정상">정상</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={channelFilter}
            onValueChange={(value) => setChannelFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="채널" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">전체 채널</SelectItem>
                <SelectItem value="naver-searchad">네이버 검색광고</SelectItem>
                <SelectItem value="search-console">Search Console</SelectItem>
                <SelectItem value="business-profile">Business Profile</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          현재 {filteredEntries.length}개 고객이 조건에 맞습니다.
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>고객</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>채널</TableHead>
            <TableHead>최근 7일 요약</TableHead>
            <TableHead>이슈</TableHead>
            <TableHead>제안</TableHead>
            <TableHead>마지막 sync</TableHead>
            <TableHead className="text-right">빠른 액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => (
            <TableRow key={entry.customer.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/customers/${entry.customer.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {entry.customer.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
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
                    <ChannelBadge
                      key={connection.id}
                      channel={connection.channelType}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal text-sm text-muted-foreground">
                {entry.summaryLine}
              </TableCell>
              <TableCell>{entry.openIssues.length}건</TableCell>
              <TableCell>{entry.pendingSuggestions.length}건</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelativeTime(entry.lastSyncAt)}
              </TableCell>
              <TableCell>
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
                      리포트 없음
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
