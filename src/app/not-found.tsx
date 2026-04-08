import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          YSEO
        </p>
        <h2 className="text-3xl font-semibold">고객을 찾지 못했습니다.</h2>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">
          요청한 고객 상세가 아직 등록되지 않았거나 샘플 데이터에 포함되어 있지
          않습니다. 고객 리스트에서 다시 선택해 주세요.
        </p>
      </div>
      <Link href="/customers" className={buttonVariants({ size: "sm" })}>
        고객 리스트로 돌아가기
      </Link>
    </div>
  );
}
