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
    "자동 초안을 검수해 외부 발송 전에 다듬으세요.",
  );

  function regenerateDraft() {
    startTransition(() => {
      setStatusText("초안을 다시 생성했습니다. 운영자 메모는 유지됩니다.");
    });
  }

  function exportDraft() {
    startTransition(() => {
      setStatusText("내보내기 시뮬레이션 완료. 실제 발송은 아직 수동 단계입니다.");
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FileTextIcon data-icon="inline-start" />
        리포트 초안
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{customerName} 리포트 초안</DialogTitle>
          <DialogDescription>
            자동 생성은 초안까지입니다. 고객사 전달 전 최종 문장은 운영자가 확인합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-border/70 bg-muted/20 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Summary
              </span>
              <h3 className="text-lg font-semibold">{report.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{report.summary}</p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium">핵심 변화</h4>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  {report.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-foreground/40" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">다음 액션</h4>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  {report.nextActions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-foreground/40" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background p-5">
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Operator Note
              </span>
              <Textarea
                value={operatorNote}
                onChange={(event) => setOperatorNote(event.target.value)}
                placeholder="고객사에 전달하기 전에 덧붙일 운영자 메모를 적으세요."
                rows={10}
              />
              <p className="text-sm leading-6 text-muted-foreground">{statusText}</p>
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
