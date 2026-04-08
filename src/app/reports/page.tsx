import { PageHeader } from "@/components/page-header";
import { ReportListView } from "@/components/report-list-view";
import { listReportEntries } from "@/lib/yseo/selectors";

export default async function ReportsPage() {
  const entries = await listReportEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="초안 검토"
        title="리포트"
        description="자동 요약과 초안 생성까지만 처리하고, 최종 문장과 발송 여부는 운영자가 확인한 뒤 진행합니다."
      />

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            초안 정책
          </div>
          <h2 className="text-base font-semibold tracking-tight text-slate-950">
            초안은 자동, 최종 발송은 수동
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            고객사에 바로 나가는 문서는 자동 발송하지 않고, 운영자가 메모를 보완한 뒤 확정하는 흐름으로 유지합니다.
          </p>
        </div>
      </section>

      <ReportListView entries={entries} />
    </div>
  );
}
