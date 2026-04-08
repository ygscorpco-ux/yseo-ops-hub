import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { ReportListView } from "@/components/report-list-view";
import { listReportEntries } from "@/lib/yseo/selectors";

export default async function ReportsPage() {
  const entries = await listReportEntries();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Report Drafts"
        title="리포트"
        description="자동 요약은 초안까지만 만들고, 최종 문장은 운영자가 정리하는 흐름을 전제로 구성했습니다. 분석 툴이 아니라 반복 문서 작업을 줄이는 보조 화면입니다."
      />

      <Alert>
        <AlertTitle>자동화 범위</AlertTitle>
        <AlertDescription>
          YSEO는 리포트를 자동 발송하지 않습니다. 초안 생성, 재생성, 내부 메모 보조까지만 하고, 외부 발송은 수동 검수 이후에 진행하는 방식이 안전합니다.
        </AlertDescription>
      </Alert>

      <ReportListView entries={entries} />
    </div>
  );
}
