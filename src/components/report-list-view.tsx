"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ReportPreviewDialog } from "@/components/report-preview-dialog";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { ReportListEntry } from "@/lib/yseo/selectors";
import { fieldClass } from "@/lib/yseo/ui";
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
      eyebrow="DRAFT REVIEW"
      title="리포트 초안 목록"
      description="고객명이나 초안 제목으로 바로 찾고, 필요한 경우에만 상세 미리보기로 내려가 검수합니다."
    >
      <div className="space-y-5">
        <label className="relative block max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="고객명 또는 초안 제목 검색"
            className={`${fieldClass} w-full pl-9`}
          />
        </label>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="조건에 맞는 초안이 없습니다"
            description="검색어를 바꾸면 다시 바로 확인할 수 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">상태</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">고객</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">초안 제목</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">요약</th>
                  <th className="border-b border-slate-200 px-3 py-2.5">최근 갱신</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    미리보기
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.report.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <StatusBadge
                        value={entry.report.finalizedAt ? "executed" : "pending"}
                        label={entry.report.finalizedAt ? "확정" : "초안"}
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      {entry.customer.name}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      {entry.report.title}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-600">
                      <div className="max-w-md whitespace-normal">{entry.report.summary}</div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top text-slate-500">
                      {formatRelativeTime(entry.report.updatedAt)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 align-top">
                      <div className="flex justify-end">
                        <ReportPreviewDialog
                          customerName={entry.customer.name}
                          report={entry.report}
                        />
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
