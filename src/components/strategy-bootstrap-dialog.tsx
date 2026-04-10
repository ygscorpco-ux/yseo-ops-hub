"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StrategyPack } from "@/lib/yseo/strategy-types";
import {
  compactSecondaryActionClass,
  fieldClass,
  primaryActionClass,
  secondaryActionClass,
  textareaClass,
} from "@/lib/yseo/ui";

interface StrategyBootstrapDialogProps {
  customerId: string;
  customerName: string;
  strategyPack: StrategyPack | null;
}

function parseLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCompetitors(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function StrategyBootstrapDialog({
  customerId,
  customerName,
  strategyPack,
}: StrategyBootstrapDialogProps) {
  const router = useRouter();
  const [masterCustomerId, setMasterCustomerId] = useState(
    strategyPack?.masterCustomerId ?? "",
  );
  const [conversionGoal, setConversionGoal] = useState(
    strategyPack?.goalProfile.conversionGoal ?? "전화 문의",
  );
  const [monthlyBudget, setMonthlyBudget] = useState(
    strategyPack?.goalProfile.monthlyBudget
      ? String(strategyPack.goalProfile.monthlyBudget)
      : "",
  );
  const [weeklyPrimaryKpi, setWeeklyPrimaryKpi] = useState(
    strategyPack?.goalProfile.weeklyPrimaryKpi ?? "전환수",
  );
  const [targetCpa, setTargetCpa] = useState(
    strategyPack?.goalProfile.targetCpa
      ? String(strategyPack.goalProfile.targetCpa)
      : "",
  );
  const [targetCpc, setTargetCpc] = useState(
    strategyPack?.goalProfile.targetCpc
      ? String(strategyPack.goalProfile.targetCpc)
      : "",
  );
  const [targetCtr, setTargetCtr] = useState(
    strategyPack?.goalProfile.targetCtr
      ? String(strategyPack.goalProfile.targetCtr)
      : "",
  );
  const [industry, setIndustry] = useState(
    strategyPack?.strategyProfile.industry ?? "",
  );
  const [region, setRegion] = useState(
    strategyPack?.strategyProfile.region ?? "",
  );
  const [primaryService, setPrimaryService] = useState(
    strategyPack?.strategyProfile.primaryService ?? "",
  );
  const [competitors, setCompetitors] = useState(
    strategyPack?.strategyProfile.competitors.join("\n") ?? "",
  );
  const [landingUrl, setLandingUrl] = useState(
    strategyPack?.strategyProfile.landingUrl ?? "",
  );
  const [brandTone, setBrandTone] = useState(
    strategyPack?.strategyProfile.brandTone ?? "",
  );
  const [businessSummary, setBusinessSummary] = useState(
    strategyPack?.researchSummary.businessSummary ?? "",
  );
  const [keywordClusters, setKeywordClusters] = useState(
    strategyPack?.keywordClusters.join("\n") ?? "",
  );
  const [negativeKeywords, setNegativeKeywords] = useState(
    strategyPack?.negativeKeywords.join("\n") ?? "",
  );
  const [copyAngles, setCopyAngles] = useState(
    strategyPack?.copyAngles.join("\n") ?? "",
  );
  const [landingRisks, setLandingRisks] = useState(
    strategyPack?.landingRisks.join("\n") ?? "",
  );
  const [searchConsoleWatchpoints, setSearchConsoleWatchpoints] = useState(
    strategyPack?.searchConsoleWatchpoints.join("\n") ?? "",
  );
  const [twoWeekPlan, setTwoWeekPlan] = useState(
    strategyPack?.twoWeekPlan.join("\n") ?? "",
  );
  const [fourWeekPlan, setFourWeekPlan] = useState(
    strategyPack?.fourWeekPlan.join("\n") ?? "",
  );
  const [rawNotes, setRawNotes] = useState(
    strategyPack?.researchSummary.rawNotes ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerLabel = useMemo(
    () => (strategyPack ? "전략 갱신" : "전략 세팅"),
    [strategyPack],
  );

  function handleSave() {
    if (!industry.trim() || !region.trim() || !primaryService.trim()) {
      setErrorMessage("업종, 지역, 핵심 서비스를 먼저 입력해 주세요.");
      return;
    }

    if (!conversionGoal.trim() || !weeklyPrimaryKpi.trim()) {
      setErrorMessage("목표 전환과 주 KPI를 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch("/api/strategy/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            masterCustomerId: masterCustomerId.trim() || undefined,
            sourceType: rawNotes.trim() ? "gpt-pro" : "manual",
            goalProfile: {
              conversionGoal: conversionGoal.trim(),
              monthlyBudget: Number(monthlyBudget) || 0,
              weeklyPrimaryKpi: weeklyPrimaryKpi.trim(),
              targetCpa: toNumber(targetCpa),
              targetCpc: toNumber(targetCpc),
              targetCtr: toNumber(targetCtr),
            },
            strategyProfile: {
              industry: industry.trim(),
              region: region.trim(),
              primaryService: primaryService.trim(),
              competitors: parseCompetitors(competitors),
              landingUrl: landingUrl.trim() || undefined,
              brandTone: brandTone.trim() || undefined,
            },
            researchSummary: {
              businessSummary: businessSummary.trim() || `${customerName} 검색광고 운영 전략 초안`,
              keywordClusters: parseLines(keywordClusters),
              negativeKeywords: parseLines(negativeKeywords),
              copyAngles: parseLines(copyAngles),
              landingRisks: parseLines(landingRisks),
              searchConsoleWatchpoints: parseLines(searchConsoleWatchpoints),
              alertRules: [],
              twoWeekPlan: parseLines(twoWeekPlan),
              fourWeekPlan: parseLines(fourWeekPlan),
              rawNotes: rawNotes.trim() || undefined,
            },
          }),
        });

        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? "전략팩 저장에 실패했습니다.");
        }

        setSuccessMessage(payload.message ?? "전략팩을 저장했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "전략팩 저장에 실패했습니다.",
        );
      } finally {
        setIsSaving(false);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" className={compactSecondaryActionClass} />}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            전략 팩
          </div>
          <DialogTitle>{customerName} 전략 세팅</DialogTitle>
          <DialogDescription>
            최초 전략팩이나 GPT Pro 리서치 결과를 여기에 저장합니다. 자동 감시와 제안
            엔진은 이 내용을 기준으로 동작합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-2">
          <section className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              기본 매핑
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  종합허브 고객 ID
                </span>
                <input
                  value={masterCustomerId}
                  onChange={(event) => setMasterCustomerId(event.target.value)}
                  placeholder="masterCustomerId"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  목표 전환
                </span>
                <input
                  value={conversionGoal}
                  onChange={(event) => setConversionGoal(event.target.value)}
                  placeholder="전화 문의 / 예약 / 상담 신청"
                  className={`${fieldClass} w-full`}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              목표 프로필
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  월 예산
                </span>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(event) => setMonthlyBudget(event.target.value)}
                  placeholder="300000"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  주 KPI
                </span>
                <input
                  value={weeklyPrimaryKpi}
                  onChange={(event) => setWeeklyPrimaryKpi(event.target.value)}
                  placeholder="전환수 / CPA / 전화 문의"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  목표 CPA
                </span>
                <input
                  type="number"
                  value={targetCpa}
                  onChange={(event) => setTargetCpa(event.target.value)}
                  placeholder="35000"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  목표 CPC
                </span>
                <input
                  type="number"
                  value={targetCpc}
                  onChange={(event) => setTargetCpc(event.target.value)}
                  placeholder="1500"
                  className={`${fieldClass} w-full`}
                />
              </label>
            </div>
            <label className="space-y-2 md:max-w-xs">
              <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                목표 CTR
              </span>
              <input
                type="number"
                step="0.1"
                value={targetCtr}
                onChange={(event) => setTargetCtr(event.target.value)}
                placeholder="2.5"
                className={`${fieldClass} w-full`}
              />
            </label>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              전략 프로필
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  업종
                </span>
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="필라테스 / 치과 / 부동산"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  지역
                </span>
                <input
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="분당 / 강남 / 전국"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  핵심 서비스
                </span>
                <input
                  value={primaryService}
                  onChange={(event) => setPrimaryService(event.target.value)}
                  placeholder="임플란트 / 체형교정 / 분양상담"
                  className={`${fieldClass} w-full`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  랜딩 URL
                </span>
                <input
                  value={landingUrl}
                  onChange={(event) => setLandingUrl(event.target.value)}
                  placeholder="https://example.com/landing"
                  className={`${fieldClass} w-full`}
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  경쟁사
                </span>
                <textarea
                  value={competitors}
                  onChange={(event) => setCompetitors(event.target.value)}
                  rows={4}
                  placeholder="경쟁사 또는 비교 브랜드를 줄바꿈으로 입력"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  브랜드 톤 / 금지 표현
                </span>
                <textarea
                  value={brandTone}
                  onChange={(event) => setBrandTone(event.target.value)}
                  rows={4}
                  placeholder="브랜드 톤, 법적 제약, 금지 표현"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              GPT Pro 리서치 / 전략 메모
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                사업 요약
              </span>
              <textarea
                value={businessSummary}
                onChange={(event) => setBusinessSummary(event.target.value)}
                rows={3}
                placeholder="이 고객의 검색광고 전략을 한 문단으로 요약"
                className={`${textareaClass} w-full resize-none`}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  키워드 클러스터
                </span>
                <textarea
                  value={keywordClusters}
                  onChange={(event) => setKeywordClusters(event.target.value)}
                  rows={6}
                  placeholder="줄바꿈으로 입력"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  제외 키워드
                </span>
                <textarea
                  value={negativeKeywords}
                  onChange={(event) => setNegativeKeywords(event.target.value)}
                  rows={6}
                  placeholder="줄바꿈 또는 쉼표 구분"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  광고 문안 각도
                </span>
                <textarea
                  value={copyAngles}
                  onChange={(event) => setCopyAngles(event.target.value)}
                  rows={6}
                  placeholder="예: 가격형, 후기형, 지역밀착형"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  랜딩 리스크
                </span>
                <textarea
                  value={landingRisks}
                  onChange={(event) => setLandingRisks(event.target.value)}
                  rows={6}
                  placeholder="전환을 방해할 수 있는 요소"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  Search Console 관찰 포인트
                </span>
                <textarea
                  value={searchConsoleWatchpoints}
                  onChange={(event) => setSearchConsoleWatchpoints(event.target.value)}
                  rows={6}
                  placeholder="브랜디드 쿼리 / 랜딩별 클릭 / recent incomplete"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  GPT Pro 원문 메모
                </span>
                <textarea
                  value={rawNotes}
                  onChange={(event) => setRawNotes(event.target.value)}
                  rows={6}
                  placeholder="GPT Pro 결과 전문이나 추가 메모"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  2주 실행 계획
                </span>
                <textarea
                  value={twoWeekPlan}
                  onChange={(event) => setTwoWeekPlan(event.target.value)}
                  rows={5}
                  placeholder="초기 2주 액션"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  4주 실행 계획
                </span>
                <textarea
                  value={fourWeekPlan}
                  onChange={(event) => setFourWeekPlan(event.target.value)}
                  rows={5}
                  placeholder="4주 기준 확장 / 재평가 계획"
                  className={`${textareaClass} w-full resize-none`}
                />
              </label>
            </div>
          </section>

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<button type="button" className={secondaryActionClass} />}>
            닫기
          </DialogClose>
          <button
            type="button"
            onClick={handleSave}
            className={primaryActionClass}
            disabled={isSaving}
          >
            {isSaving ? "저장 중" : "전략팩 저장"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
