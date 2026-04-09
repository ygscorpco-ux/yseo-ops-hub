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
} from "@/lib/yseo/ui";

export function CustomerOnboardingDialog() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [naverCustomerId, setNaverCustomerId] = useState("");
  const [naverDisplayName, setNaverDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setNaverCustomerId("");
    setNaverDisplayName("");
  }

  function handleCreateCustomer() {
    if (name.trim().length === 0) {
      setErrorMessage("상호를 먼저 입력해 주세요.");
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
            naverCustomerId,
            naverDisplayName,
          }),
        });

        const data = (await response.json()) as {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "고객 연결 생성에 실패했습니다.");
        }

        setMessage(data.message ?? "고객 연결이 추가되었습니다.");
        router.refresh();
        resetForm();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "고객 연결 생성에 실패했습니다.",
        );
      } finally {
        setIsSaving(false);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" className={primaryActionClass} />}
      >
        고객 연결 추가
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            고객 연결
          </div>
          <DialogTitle>고객 상태판에 추가</DialogTitle>
          <DialogDescription>
            고객 마스터를 만드는 것이 아니라, 상호와 네이버 연결값만 먼저 붙입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              상호
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 오월치과"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              네이버 customer ID
            </span>
            <input
              value={naverCustomerId}
              onChange={(event) => setNaverCustomerId(event.target.value)}
              placeholder="예: 4347305"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              네이버 표시 이름
            </span>
            <input
              value={naverDisplayName}
              onChange={(event) => setNaverDisplayName(event.target.value)}
              placeholder="예: 오월치과 검색광고"
              className={`${fieldClass} w-full`}
            />
          </label>
        </div>

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
            {isSaving ? "추가 중" : "추가하기"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
