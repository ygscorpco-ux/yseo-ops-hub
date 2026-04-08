import { IssueQueueView } from "@/components/issue-queue-view";
import { PageHeader } from "@/components/page-header";
import { listIssueQueueEntries } from "@/lib/yseo/selectors";

export default async function IssuesPage() {
  const entries = await listIssueQueueEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="작업 기준"
        title="작업 큐"
        description="고객 기준이 아니라 작업 기준으로 정렬합니다. 자동 실행보다 승인 대기와 수동 검토가 필요한 항목을 먼저 보여줍니다."
      />

      <section className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700">
            수동 검토
          </div>
          <h2 className="text-base font-semibold tracking-tight text-slate-950">
            예산 변경, 리뷰 답글, 계정 권한 변경은 자동 실행하지 않습니다
          </h2>
          <p className="text-sm leading-6 text-slate-700">
            YSEO는 먼저 확인이 필요한 작업만 모아 보여주고, 최종 반영은 운영자 승인 이후에 진행합니다.
          </p>
        </div>
      </section>

      <IssueQueueView entries={entries} />
    </div>
  );
}
