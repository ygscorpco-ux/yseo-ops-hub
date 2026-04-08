"use client";

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
import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { getOperatorPlaybook, getPrimarySurfaceLabel } from "@/lib/yseo/operator-playbooks";
import type { Issue } from "@/lib/yseo/types";
import {
  compactSecondaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";

interface IssuePlaybookDialogProps {
  issue: Issue;
  customerName: string;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function IssuePlaybookDialog({
  issue,
  customerName,
}: IssuePlaybookDialogProps) {
  const playbook = getOperatorPlaybook(issue);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={`${compactSecondaryActionClass} rounded-md px-2.5 py-1.5 text-xs`}
          />
        }
      >
        체크리스트
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            운영 가이드
          </div>
          <DialogTitle>{customerName} 이슈 체크리스트</DialogTitle>
          <DialogDescription>
            YSEO는 문제를 먼저 보여주고, 원본 채널 화면에서는 무엇을 봐야 하는지까지
            같이 정리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StateChip
            label={getPrimarySurfaceLabel(playbook.primarySurface, issue.channelType)}
            tone={playbook.primarySurface === "yseo" ? "sky" : "amber"}
          />
          <StateChip
            label={
              playbook.canResolveInsideYseo
                ? "YSEO 안에서 처리 가능"
                : "원본 채널 확인 필요"
            }
            tone={playbook.canResolveInsideYseo ? "emerald" : "slate"}
          />
        </div>

        <SectionCard
          eyebrow="핵심 판단"
          title={playbook.title}
          description={playbook.summary}
          bodyClassName="space-y-4"
        >
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            권장 액션: {issue.recommendedAction}
          </div>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard eyebrow="먼저 볼 것" title="YSEO에서 먼저 확인">
            <BulletList items={playbook.firstChecks} />
          </SectionCard>

          <SectionCard eyebrow="원본 채널" title="원본 화면에서 확인">
            <BulletList items={playbook.consoleChecks} />
          </SectionCard>

          <SectionCard eyebrow="후속 처리" title="정리하고 남길 것">
            <BulletList items={playbook.yseoFollowUps} />
          </SectionCard>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-700">
          에스컬레이션 기준: {playbook.escalationRule}
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
