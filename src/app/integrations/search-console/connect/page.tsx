import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import {
  compactSecondaryActionClass,
  primaryActionClass,
  secondaryActionClass,
} from "@/lib/yseo/ui";
import { getSearchConsoleSelectionSession } from "@/lib/yseo/google-search-console";

export const dynamic = "force-dynamic";

export default async function SearchConsoleConnectPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    customerId?: string;
    error?: string;
  }>;
}) {
  const { state, customerId, error } = await searchParams;

  if (!state || !customerId) {
    notFound();
  }

  const session = await getSearchConsoleSelectionSession(state);

  if (!session || session.customerId !== customerId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Search Console 연결"
          title="연결 세션을 찾을 수 없습니다"
          description="Google 동의가 만료됐거나 이미 처리된 상태입니다. 고객 상세에서 다시 시작해 주세요."
          actions={
            <Link href={`/customers/${customerId}`} className={secondaryActionClass}>
              고객 상세로 돌아가기
            </Link>
          }
        />

        <SectionCard
          eyebrow="다시 시작"
          title="OAuth를 다시 시작해 주세요"
          description="세션이 만료됐거나 중복으로 처리된 경우입니다."
        >
          <div className="space-y-4 text-sm leading-6 text-slate-700">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                {error}
              </div>
            ) : null}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              고객 상세 화면에서 다시 <strong>Search Console 연결</strong>을 눌러 주세요.
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Search Console 연결"
        title={`${session.customerName} property 선택`}
        description="Google 동의가 완료됐습니다. 이 고객에 연결할 Search Console property를 하나 선택하면 7일 검증 수집까지 바로 진행합니다."
        actions={
          <Link href={`/customers/${customerId}`} className={secondaryActionClass}>
            고객 상세로 돌아가기
          </Link>
        }
      />

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4 text-sm leading-6 text-rose-700">
          {error}
        </section>
      ) : null}

      <SectionCard
        eyebrow="Google property"
        title="연결할 Search Console 속성"
        description="운영 권한으로 조회 가능한 property 목록입니다. 나중에 다른 property로 바꿔도 기존 고객 데이터는 유지됩니다."
      >
        {session.siteEntries.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            이 Google 계정에서 접근 가능한 Search Console property가 없습니다.
          </div>
        ) : (
          <form
            action={`/api/customers/${customerId}/search-console-connection`}
            method="POST"
            className="space-y-4"
          >
            <input type="hidden" name="oauthState" value={state} />

            <div className="space-y-3">
              {session.siteEntries.map((site, index) => (
                <label
                  key={site.siteUrl}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-950"
                >
                  <input
                    type="radio"
                    name="siteUrl"
                    value={site.siteUrl}
                    defaultChecked={index === 0}
                    className="mt-1 h-4 w-4 border-slate-300 text-slate-950"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-950">{site.siteUrl}</div>
                    <div className="text-xs leading-5 text-slate-500">
                      권한 수준: {site.permissionLevel}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              저장하면 YSEO가 최근 7일 Search Analytics 합계를 먼저 조회해서 연결 상태를 검증합니다.
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryActionClass}>
                이 property로 연결
              </button>
              <Link
                href={`/customers/${customerId}`}
                className={`inline-flex items-center ${compactSecondaryActionClass}`}
              >
                다음에 할게요
              </Link>
            </div>
          </form>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="운영 메모"
        title="이 단계에서 확인할 것"
        description="초기에는 고객당 대표 property 하나만 연결하는 편이 운영이 단순합니다."
      >
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          <li>도메인 property와 URL-prefix property가 같이 보이면, 운영 기준으로 대표 property 하나만 먼저 연결합니다.</li>
          <li>권한 수준이 `siteRestrictedUser`라면 조회는 가능하지만 운영 범위가 좁을 수 있습니다.</li>
          <li>연결이 끝나면 고객 상세의 채널 카드에 Search Console이 추가되고, 7일 클릭/노출 요약이 함께 저장됩니다.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
