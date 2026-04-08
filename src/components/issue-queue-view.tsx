"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ChannelBadge } from "@/components/channel-badge";
import { StatusBadge } from "@/components/status-badge";
import { SuggestionReviewDialog } from "@/components/suggestion-review-dialog";
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이슈 제목, 고객명, 요약으로 찾기"
              className="pl-9"
            />
          </div>

          <Select
            value={severityFilter}
            onValueChange={(value) => setSeverityFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="치명도" />
            </SelectTrigger>
            <SelectContent>
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

        <div className="text-sm text-muted-foreground">
          현재 {filteredEntries.length}건이 작업 큐에 남아 있습니다.
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>치명도</TableHead>
            <TableHead>고객</TableHead>
            <TableHead>채널</TableHead>
            <TableHead>이슈</TableHead>
            <TableHead>권장 액션</TableHead>
            <TableHead>감지 시각</TableHead>
            <TableHead className="text-right">처리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => (
            <TableRow key={entry.issue.id}>
              <TableCell>
                <StatusBadge value={entry.issue.severity} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/customers/${entry.customer.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {entry.customer.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {entry.customer.statusTag}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <ChannelBadge channel={entry.issue.channelType} />
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal">
                <div className="space-y-1">
                  <div className="font-medium">{entry.issue.title}</div>
                  <p className="text-sm text-muted-foreground">{entry.issue.summary}</p>
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal text-sm text-muted-foreground">
                {entry.issue.recommendedAction}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelativeTime(entry.issue.detectedAt)}
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
    </div>
  );
}
