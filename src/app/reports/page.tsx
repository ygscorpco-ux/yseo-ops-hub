import { MonthlyReportBatchPanel } from "@/components/monthly-report-batch-panel";
import { PageHeader } from "@/components/page-header";
import { ReportListView } from "@/components/report-list-view";
import { listReportEntries } from "@/lib/yseo/selectors";
import { getMonthlyReportBatchStatus } from "@/lib/yseo/report-batch";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [entries, batchStatus] = await Promise.all([
    listReportEntries(),
    getMonthlyReportBatchStatus(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="리포트"
        title="월말 발행 초안"
        description="자동 초안을 만들고 마지막 검수만 남겨둡니다."
      />

      <MonthlyReportBatchPanel
        initialStatus={{
          status: "ok",
          ...batchStatus,
        }}
      />

      <ReportListView entries={entries} />
    </div>
  );
}
