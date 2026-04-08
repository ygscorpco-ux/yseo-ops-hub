"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { SectionCard } from "@/components/section-card";
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
    <SectionCard
      eyebrow="Draft review"
      title="리포트 초안 목록"
      description="검색으로 고객이나 초안을 바로 찾고, 필요한 경우만 상세 미리보기로 내려가 검수합니다."
    >
      <div className="flex flex-col gap-5">
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="고객명이나 초안 제목 검색"
            className="border-slate-300 bg-white pl-9"
          />
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 초안이 없습니다."
            description="검색어를 바꾸면 다시 바로 확인할 수 있습니다."
          />
        ) : (
          <Table className="rounded-xl border border-slate-200 bg-white">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="px-4 text-slate-500">상태</TableHead>
                <TableHead className="text-slate-500">고객</TableHead>
                <TableHead className="text-slate-500">초안 제목</TableHead>
                <TableHead className="text-slate-500">요약</TableHead>
                <TableHead className="text-slate-500">최근 갱신</TableHead>
                <TableHead className="px-4 text-right text-slate-500">미리보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.report.id} className="hover:bg-slate-50">
                  <TableCell className="px-4">
                    <StatusBadge
                      value={entry.report.finalizedAt ? "executed" : "pending"}
                      label={entry.report.finalizedAt ? "확정" : "초안"}
                    />
                  </TableCell>
                  <TableCell>{entry.customer.name}</TableCell>
                  <TableCell>{entry.report.title}</TableCell>
                  <TableCell className="max-w-md whitespace-normal text-sm text-slate-600">
                    {entry.report.summary}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatRelativeTime(entry.report.updatedAt)}
                  </TableCell>
                  <TableCell className="px-4">
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
        )}
      </div>
    </SectionCard>
  );
}
