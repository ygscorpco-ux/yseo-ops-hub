"use client";

import { startTransition, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ReportDraft } from "@/lib/yseo/types";
import {
  compactSecondaryActionClass,
  primaryActionClass,
  secondaryActionClass,
  textareaClass,
} from "@/lib/yseo/ui";

interface ReportPreviewDialogProps {
  customerName: string;
  report: ReportDraft;
}

export function ReportPreviewDialog({
  customerName,
  report,
}: ReportPreviewDialogProps) {
  const [operatorNote, setOperatorNote] = useState("");
  const [statusText, setStatusText] = useState(
    "자동 초안은 참고용입니다. 최종 문장과 전달 방식은 운영자가 확인한 뒤 확정합니다.",
  );

  function regenerateDraft() {
    startTransition(() => {
      setStatusText("초안을 다시 정리했습니다. 운영 메모는 유지한 상태입니다.");
    });
  }

  function exportDraft() {
    startTransition(() => {
      setStatusText("내보내기 준비 상태로 변경했습니다. 실제 발송은 아직 수동 단계입니다.");
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" className={`${compactSecondaryActionClass} rounded-md px-2.5 py-1.5 text-xs`} />}
      >
        초안 보기
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            리포트 초안
          </div>
          <DialogTitle>{customerName} 리포트 초안</DialogTitle>
          <DialogDescription>
            자동 생성은 초안까지만 담당합니다. 최종 문장과 발송 여부는 운영자가 결정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
              요약
            </div>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
              {report.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{report.summary}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                  주요 변화
                </div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                  {report.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                  다음 액션
                </div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                  {report.nextActions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
              운영 메모
            </div>
            <textarea
              value={operatorNote}
              onChange={(event) => setOperatorNote(event.target.value)}
              placeholder="고객 전달 전에 붙일 운영 메모를 적어주세요."
              rows={10}
              className={`${textareaClass} mt-3 min-h-[240px] w-full px-3 py-3`}
            />
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {statusText}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button type="button" className={secondaryActionClass} onClick={regenerateDraft}>
            초안 재생성
          </button>
          <button type="button" className={primaryActionClass} onClick={exportDraft}>
            내보내기 준비
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
