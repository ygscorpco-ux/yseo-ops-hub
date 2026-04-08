import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IssueQueueView } from "@/components/issue-queue-view";
import { PageHeader } from "@/components/page-header";
import { listIssueQueueEntries } from "@/lib/yseo/selectors";

export default async function IssuesPage() {
  const entries = await listIssueQueueEntries();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Issue queue"
        title="작업 큐"
        description="고객 기준이 아니라 작업 기준으로 정렬합니다. 자동 실행보다 승인 대기와 수동 검토가 먼저 보이도록 설계했습니다."
      />

      <Alert className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm">
        <AlertTitle className="text-slate-950">운영 원칙</AlertTitle>
        <AlertDescription>
          예산 변경, 리뷰 발행, 토큰 갱신 같은 민감한 작업은 자동 처리하지 않습니다.
          여기서는 먼저 검토가 필요한 항목만 모아 보여줍니다.
        </AlertDescription>
      </Alert>

      <IssueQueueView entries={entries} />
    </div>
  );
}
