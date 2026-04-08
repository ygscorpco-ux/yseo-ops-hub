"use client";

import { startTransition, useMemo, useState } from "react";
import { CheckCircle2Icon, PauseCircleIcon, SparklesIcon } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Suggestion } from "@/lib/yseo/types";

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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <SparklesIcon data-icon="inline-start" />
        {triggerLabel ?? `제안 ${items.length}건 검토`}
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl border-slate-200 bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{customerName} 제안 검토</DialogTitle>
          <DialogDescription>
            자동 실행은 하지 않습니다. 승인 대기 제안만 모아서 운영자가 최종 판단할 수 있게 정리했습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value="pending" label={`승인 대기 ${pendingCount}건`} />
          <StatusBadge
            value="approved"
            label={`승인됨 ${items.filter((item) => item.approvalStatus === "approved").length}건`}
          />
          <StatusBadge
            value="executed"
            label={`실행 완료 ${items.filter((item) => item.approvalStatus === "executed").length}건`}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600">{item.summary}</p>
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

                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {item.rationaleText}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      실행 미리보기
                    </span>
                    <ul className="flex flex-col gap-2 text-sm text-slate-700">
                      {item.payloadPreview.map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateSuggestion(item.id, "approved")}
                      disabled={item.approvalStatus === "approved"}
                    >
                      <CheckCircle2Icon data-icon="inline-start" />
                      승인 대기 해제
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSuggestion(item.id, "paused")}
                      disabled={item.approvalStatus === "paused"}
                    >
                      <PauseCircleIcon data-icon="inline-start" />
                      보류
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
