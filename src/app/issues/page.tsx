import { IssueQueueView } from "@/components/issue-queue-view";
import { PageHeader } from "@/components/page-header";
import { listIssueQueueEntries } from "@/lib/yseo/selectors";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const entries = await listIssueQueueEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="작업 큐"
        title="이슈와 승인 대기 작업"
        description="먼저 처리해야 할 작업만 위로 올려둡니다."
      />

      <IssueQueueView entries={entries} />
    </div>
  );
}
