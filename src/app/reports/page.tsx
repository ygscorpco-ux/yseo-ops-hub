import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { ReportListView } from "@/components/report-list-view";
import { listReportEntries } from "@/lib/yseo/selectors";

export default async function ReportsPage() {
  const entries = await listReportEntries();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Report drafts"
        title="리포트"
        description="자동 요약은 초안까지만 만듭니다. 최종 문장과 발송은 운영자가 검토한 뒤 진행하는 흐름으로 유지합니다."
      />

      <Alert className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm">
        <AlertTitle className="text-slate-950">자동화 범위</AlertTitle>
        <AlertDescription>
          YSEO는 리포트를 자동 발송하지 않습니다. 초안 생성과 검수 보조까지만 담당합니다.
        </AlertDescription>
      </Alert>

      <ReportListView entries={entries} />
    </div>
  );
}
