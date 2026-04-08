"use client";

import { startTransition, useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Suggestion } from "@/lib/yseo/types";
import {
  compactSecondaryActionClass,
  primaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";

interface SuggestionReviewDialogProps {
  customerName: string;
  suggestions: Suggestion[];
  triggerLabel?: string;
}

export function SuggestionReviewDialog({
  customerName,
  suggestions,
  triggerLabel,
}: SuggestionReviewDialogProps) {
  const [items, setItems] = useState(suggestions);
  const pendingCount = useMemo(
    () => items.filter((item) => item.approvalStatus === "pending").length,
    [items],
  );

  function updateSuggestion(id: string, nextStatus: Suggestion["approvalStatus"]) {
    startTransition(() => {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, approvalStatus: nextStatus } : item,
        ),
      );
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" className={`${compactSecondaryActionClass} rounded-md px-2.5 py-1.5 text-xs`} />}
      >
        {triggerLabel ?? `제안 ${items.length}건`}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            SUGGESTION REVIEW
          </div>
          <DialogTitle>{customerName} 제안 검토</DialogTitle>
          <DialogDescription>
            자동 실행은 하지 않습니다. 승인 대기 제안만 모아 보고, 최종 반영 여부는 운영자가 결정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          승인 대기 {pendingCount}건, 전체 {items.length}건을 한 번에 검토할 수 있습니다.
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight text-slate-950">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">{item.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={item.approvalStatus} />
                    <StatusBadge
                      value={
                        item.riskLevel === "manual"
                          ? "high"
                          : item.riskLevel === "guarded"
                            ? "medium"
                            : "low"
                      }
                      label={`리스크 ${item.riskLevel}`}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {item.rationaleText}
                </div>

                <div>
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                    실행 미리보기
                  </div>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    {item.payloadPreview.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateSuggestion(item.id, "approved")}
                    disabled={item.approvalStatus === "approved"}
                    className={primaryActionClass}
                  >
                    승인 대기 해제
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSuggestion(item.id, "paused")}
                    disabled={item.approvalStatus === "paused"}
                    className={secondaryActionClass}
                  >
                    보류
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <DialogFooter>
          <DialogClose render={<button type="button" className={secondaryActionClass} />}>
            닫기
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
