import { AlertDescription, AlertTitle, Alert } from "@/components/ui/alert";
import { IssueQueueView } from "@/components/issue-queue-view";
import { PageHeader } from "@/components/page-header";
import { listIssueQueueEntries } from "@/lib/yseo/selectors";

export default function IssuesPage() {
  const entries = listIssueQueueEntries();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Issue Queue"
        title="작업 큐 / 이슈함"
        description="고객이 아니라 작업 기준으로 정렬합니다. 자동 실행보다 승인 대기와 수동 검수가 필요한 건을 먼저 올리는 구조를 유지했습니다."
      />

      <Alert>
        <AlertTitle>운영 원칙</AlertTitle>
        <AlertDescription>
          대량 예산 변경, 리뷰 답글 발행, 토큰/권한 변경은 자동으로 처리하지 않습니다. 이 큐는 어디까지나 운영자가 빠르게 판단할 수 있도록 문맥을 모아주는 화면입니다.
        </AlertDescription>
      </Alert>

      <IssueQueueView entries={entries} />
    </div>
  );
}
