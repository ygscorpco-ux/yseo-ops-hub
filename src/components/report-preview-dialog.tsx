"use client";

import { startTransition, useState } from "react";
import { DownloadIcon, FileTextIcon, RefreshCcwIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import type { ReportDraft } from "@/lib/yseo/types";

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
    "자동 초안을 검토한 뒤 전달용 문장을 정리하세요.",
  );

  function regenerateDraft() {
    startTransition(() => {
      setStatusText("초안을 다시 생성했습니다. 운영자 메모는 유지됩니다.");
    });
  }

  function exportDraft() {
    startTransition(() => {
      setStatusText("내보내기 준비 상태로 표시했습니다. 실제 발송은 아직 수동 단계입니다.");
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FileTextIcon data-icon="inline-start" />
        초안 보기
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl border-slate-200 bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{customerName} 리포트 초안</DialogTitle>
          <DialogDescription>
            자동 생성은 초안까지만 담당합니다. 최종 문장과 발송 여부는 운영자가 결정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Summary
              </span>
              <h3 className="text-lg font-semibold text-slate-950">{report.title}</h3>
              <p className="text-sm leading-7 text-slate-600">{report.summary}</p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-950">주요 변화</h4>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                  {report.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-950">다음 액션</h4>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
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

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Operator note
              </span>
              <Textarea
                value={operatorNote}
                onChange={(event) => setOperatorNote(event.target.value)}
                placeholder="고객사 전달 전에 붙일 운영 메모를 적어두세요."
                rows={10}
                className="border-slate-300 bg-white"
              />
              <p className="text-sm leading-6 text-slate-600">{statusText}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={regenerateDraft}>
            <RefreshCcwIcon data-icon="inline-start" />
            초안 재생성
          </Button>
          <Button onClick={exportDraft}>
            <DownloadIcon data-icon="inline-start" />
            내보내기 준비
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
