"use client";

import { startTransition, useState } from "react";
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
import {
  fieldClass,
  primaryActionClass,
  secondaryActionClass,
  textareaClass,
} from "@/lib/yseo/ui";

export function CustomerOnboardingDialog() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [primaryManager, setPrimaryManager] = useState("YSEO");
  const [segment, setSegment] = useState("신규 고객");
  const [focus, setFocus] = useState(
    "첫 연결과 기준 KPI를 확인하고 운영 기준선을 설정합니다.",
  );
  const [reportingProfile, setReportingProfile] = useState("주간");
  const [statusTag, setStatusTag] = useState("오늘 확인");
  const [memoSummary, setMemoSummary] = useState("");
  const [naverCustomerId, setNaverCustomerId] = useState("");
  const [naverDisplayName, setNaverDisplayName] = useState("");
  const [naverConnectionStatus, setNaverConnectionStatus] = useState("attention");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setPrimaryManager("YSEO");
    setSegment("신규 고객");
    setFocus("첫 연결과 기준 KPI를 확인하고 운영 기준선을 설정합니다.");
    setReportingProfile("주간");
    setStatusTag("오늘 확인");
    setMemoSummary("");
    setNaverCustomerId("");
    setNaverDisplayName("");
    setNaverConnectionStatus("attention");
  }

  function handleCreateCustomer() {
    if (name.trim().length === 0) {
      setErrorMessage("고객명을 먼저 입력해 주세요.");
      return;
    }

    if (primaryManager.trim().length === 0) {
      setErrorMessage("담당자를 먼저 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            primaryManager,
            segment,
            focus,
            reportingProfile,
            statusTag,
            memoSummary,
            naverCustomerId,
            naverDisplayName,
            naverConnectionStatus,
          }),
        });

        const data = (await response.json()) as {
          message?: string;
          customerId?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "신규 고객 등록에 실패했습니다.");
        }

        setMessage(data.message ?? "신규 고객을 등록했습니다.");
        router.refresh();
        resetForm();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "신규 고객 등록에 실패했습니다.",
        );
      } finally {
        setIsSaving(false);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button type="button" className={primaryActionClass} />
        }
      >
        신규 고객 등록
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            고객 온보딩
          </div>
          <DialogTitle>신규 고객 등록</DialogTitle>
          <DialogDescription>
            고객 기본 정보와 네이버 연결 기준을 한 번에 저장합니다. 등록 직후 고객 리스트, 작업 큐, 대시보드에 바로 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              고객명
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 서울치과"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              담당자
            </span>
            <input
              value={primaryManager}
              onChange={(event) => setPrimaryManager(event.target.value)}
              placeholder="예: YSEO"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              고객 구분
            </span>
            <input
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              placeholder="예: 병원 / 로컬 / 쇼핑몰"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              리포트 주기
            </span>
            <select
              value={reportingProfile}
              onChange={(event) => setReportingProfile(event.target.value)}
              className={fieldClass}
            >
              <option value="주간">주간</option>
              <option value="격주">격주</option>
              <option value="월간">월간</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              운영 초점
            </span>
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="첫 연결과 기준 KPI를 확인하고 운영 기준선을 설정합니다."
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              초기 상태 태그
            </span>
            <select
              value={statusTag}
              onChange={(event) => setStatusTag(event.target.value)}
              className={fieldClass}
            >
              <option value="긴급 조치">긴급 조치</option>
              <option value="오늘 확인">오늘 확인</option>
              <option value="관찰">관찰</option>
              <option value="정상">정상</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              네이버 연결 상태
            </span>
            <select
              value={naverConnectionStatus}
              onChange={(event) => setNaverConnectionStatus(event.target.value)}
              className={fieldClass}
            >
              <option value="attention">확인 필요</option>
              <option value="connected">정상 연결</option>
              <option value="blocked">차단</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                네이버 연결
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                아직 정확한 고객 ID를 모르면 비워두고 고객만 먼저 등록해도 됩니다. 이후 고객 상세에서 다시 연결할 수 있습니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  네이버 고객 ID
                </span>
                <input
                  value={naverCustomerId}
                  onChange={(event) => setNaverCustomerId(event.target.value)}
                  placeholder="cust-1234567"
                  className={`${fieldClass} w-full`}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
                  표시 이름
                </span>
                <input
                  value={naverDisplayName}
                  onChange={(event) => setNaverDisplayName(event.target.value)}
                  placeholder="운영 화면에 보일 계정명"
                  className={`${fieldClass} w-full`}
                />
              </label>
            </div>
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
            내부 메모
          </span>
          <textarea
            value={memoSummary}
            onChange={(event) => setMemoSummary(event.target.value)}
            rows={4}
            placeholder="예: 첫 미팅 완료 / KPI 기준 재확인 필요 / 랜딩 교체 예정"
            className={`${textareaClass} w-full resize-none`}
          />
        </label>

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose render={<button type="button" className={secondaryActionClass} />}>
            닫기
          </DialogClose>
          <button
            type="button"
            onClick={handleCreateCustomer}
            className={primaryActionClass}
            disabled={isSaving}
          >
            {isSaving ? "등록 중" : "고객 등록"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
