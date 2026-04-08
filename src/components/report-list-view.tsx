"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportListEntry } from "@/lib/yseo/selectors";
import { formatRelativeTime } from "@/lib/utils";

export function ReportListView({ entries }: { entries: ReportListEntry[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredEntries = useMemo(() => {
    return entries.filter(
      (entry) =>
        deferredSearch.length === 0 ||
        entry.customer.name.toLowerCase().includes(deferredSearch) ||
        entry.report.title.toLowerCase().includes(deferredSearch) ||
        entry.report.summary.toLowerCase().includes(deferredSearch),
    );
  }, [deferredSearch, entries]);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="고객명 또는 초안 제목 검색"
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>상태</TableHead>
            <TableHead>고객</TableHead>
            <TableHead>초안 제목</TableHead>
            <TableHead>핵심 요약</TableHead>
            <TableHead>최근 갱신</TableHead>
            <TableHead className="text-right">열기</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => (
            <TableRow key={entry.report.id}>
              <TableCell>
                <StatusBadge
                  value={entry.report.finalizedAt ? "executed" : "pending"}
                  label={entry.report.finalizedAt ? "확정" : "초안"}
                />
              </TableCell>
              <TableCell>{entry.customer.name}</TableCell>
              <TableCell>{entry.report.title}</TableCell>
              <TableCell className="max-w-md whitespace-normal text-sm text-muted-foreground">
                {entry.report.summary}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelativeTime(entry.report.updatedAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <ReportPreviewDialog
                    customerName={entry.customer.name}
                    report={entry.report}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
