import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import { SectionCard } from "@/components/section-card";
import { StateChip } from "@/components/state-chip";
import { StatusBadge } from "@/components/status-badge";
import { getGoogleIntegrationReadiness } from "@/lib/yseo/google-readiness";
import { compactSecondaryActionClass } from "@/lib/yseo/ui";

function ReadinessCard({
  title,
  stage,
  status,
  statusLabel,
  summary,
  nextStep,
  implementedNow,
  selectedRef,
  docsUrl,
}: {
  title: string;
  stage: string;
  status: "connected" | "attention" | "blocked";
  statusLabel: string;
  summary: string;
  nextStep: string;
  implementedNow: string;
  selectedRef?: string;
  docsUrl: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold tracking-tight text-slate-950">
            {title}
          </div>
          <div className="text-xs leading-5 text-slate-500">{stage}</div>
        </div>
        <StatusBadge value={status} label={statusLabel} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{summary}</p>

      <div className="mt-4 space-y-2 text-xs leading-5 text-slate-500">
        <div>
          <span className="font-semibold text-slate-700">현재 구현:</span>{" "}
          {implementedNow}
        </div>
        <div>
          <span className="font-semibold text-slate-700">다음 단계:</span>{" "}
          {nextStep}
        </div>
        {selectedRef ? (
          <div>
            <span className="font-semibold text-slate-700">선택된 대상:</span>{" "}
            {selectedRef}
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <Link
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center ${compactSecondaryActionClass}`}
        >
          <ExternalLinkIcon className="mr-1.5 size-4" />
          공식 문서
        </Link>
      </div>
    </div>
  );
}

export async function GoogleApiReadinessPanel() {
  const readiness = await getGoogleIntegrationReadiness();

  return (
    <SectionCard
      eyebrow="Google API"
      title="Search Console / Business Profile"
      description="구글 채널은 같은 OAuth 앱을 쓰지만, Search Console은 2단계, Business Profile은 승인 이후 3단계로 붙습니다."
    >
      <div className="flex flex-wrap items-center gap-2">
        <StateChip
          label={readiness.oauthAppConfigured ? "OAuth 앱 준비됨" : "OAuth 앱 미설정"}
          tone={readiness.oauthAppConfigured ? "emerald" : "rose"}
        />
        <StateChip label="Search Console 2단계" tone="sky" />
        <StateChip label="Business Profile 3단계" tone="violet" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
          현재 상태
        </div>
        <p className="mt-1.5 text-sm leading-6 text-slate-700">
          {readiness.oauthSummary}
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <ReadinessCard
          title={readiness.searchConsole.label}
          stage={readiness.searchConsole.roadmapStage}
          status={readiness.searchConsole.currentStatus}
          statusLabel={readiness.searchConsole.currentLabel}
          summary={readiness.searchConsole.summary}
          nextStep={readiness.searchConsole.nextStep}
          implementedNow={readiness.searchConsole.implementedNow}
          selectedRef={readiness.searchConsole.selectedRef}
          docsUrl={readiness.searchConsole.docsUrl}
        />
        <ReadinessCard
          title={readiness.businessProfile.label}
          stage={readiness.businessProfile.roadmapStage}
          status={readiness.businessProfile.currentStatus}
          statusLabel={readiness.businessProfile.currentLabel}
          summary={readiness.businessProfile.summary}
          nextStep={readiness.businessProfile.nextStep}
          implementedNow={readiness.businessProfile.implementedNow}
          selectedRef={readiness.businessProfile.selectedRef}
          docsUrl={readiness.businessProfile.docsUrl}
        />
      </div>
    </SectionCard>
  );
}
