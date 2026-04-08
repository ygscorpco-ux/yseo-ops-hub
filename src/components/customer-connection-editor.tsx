"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
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
import type { ChannelConnection } from "@/lib/yseo/types";
import {
  compactSecondaryActionClass,
  fieldClass,
  primaryActionClass,
  secondaryActionClass,
  textareaClass,
} from "@/lib/yseo/ui";

interface CustomerConnectionEditorProps {
  customerId: string;
  customerName: string;
  connection?: ChannelConnection;
}

export function CustomerConnectionEditor({
  customerId,
  customerName,
  connection,
}: CustomerConnectionEditorProps) {
  const router = useRouter();
  const [externalAccountRef, setExternalAccountRef] = useState(
    connection?.externalAccountRef ?? "",
  );
  const [externalPropertyRef, setExternalPropertyRef] = useState(
    connection?.externalPropertyRef ?? "",
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "attention" | "blocked"
  >(connection?.connectionStatus ?? "attention");
  const [syncHeadline, setSyncHeadline] = useState(connection?.syncHeadline ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerLabel = useMemo(
    () => (connection ? "네이버 연결 편집" : "네이버 연결 등록"),
    [connection],
  );

  function handleSave() {
    if (externalAccountRef.trim().length === 0) {
      setErrorMessage("네이버 고객 ID를 먼저 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/customers/${customerId}/naver-connection`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalAccountRef,
            externalPropertyRef,
            connectionStatus,
            syncHeadline,
          }),
        });

        const data = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(data.message ?? "네이버 연결 저장에 실패했습니다.");
        }

        setMessage(data.message ?? "네이버 연결 정보를 저장했습니다.");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "네이버 연결 저장에 실패했습니다.",
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
          <button
            type="button"
            className={`${compactSecondaryActionClass} rounded-md px-3 py-2`}
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            채널 연결
          </div>
          <DialogTitle>{customerName} 네이버 연결 편집</DialogTitle>
          <DialogDescription>
            네이버 광고 고객 ID와 연결 메모를 고객 상세 안에서 바로 수정합니다. 이 화면은 연결 기준만 저장하고, 실제 sync 실행은 대시보드에서 진행합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={connectionStatus} />
            {connection ? (
              <StatusBadge value={connection.syncStatus} />
            ) : (
              <StatusBadge value="idle" />
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              네이버 고객 ID
            </span>
            <input
              value={externalAccountRef}
              onChange={(event) => setExternalAccountRef(event.target.value)}
              placeholder="cust-1234567 또는 실제 customer ID"
              className={`${fieldClass} w-full`}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              표시 이름
            </span>
            <input
              value={externalPropertyRef}
              onChange={(event) => setExternalPropertyRef(event.target.value)}
              placeholder="운영 화면에 보일 계정명"
              className={`${fieldClass} w-full`}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
            연결 상태
          </span>
          <select
            value={connectionStatus}
            onChange={(event) =>
              setConnectionStatus(
                event.target.value as "connected" | "attention" | "blocked",
              )
            }
            className={fieldClass}
          >
            <option value="connected">정상 연결</option>
            <option value="attention">확인 필요</option>
            <option value="blocked">차단</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold tracking-[0.14em] text-slate-500">
            연결 메모
          </span>
          <textarea
            value={syncHeadline}
            onChange={(event) => setSyncHeadline(event.target.value)}
            rows={4}
            placeholder="예: 고객 제공 ID 재확인 필요 / 운영자 확인 후 수동 sync 예정"
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
            onClick={handleSave}
            className={primaryActionClass}
            disabled={isSaving}
          >
            {isSaving ? "저장 중" : "연결 저장"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
