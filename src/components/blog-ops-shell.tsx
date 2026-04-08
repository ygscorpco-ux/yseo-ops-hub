import Link from "next/link";
import type { ReactNode } from "react";

import { AppNavLink } from "@/components/app-nav-link";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/customers", label: "고객 리스트" },
  { href: "/issues", label: "작업 큐" },
  { href: "/reports", label: "리포트" },
];

export function BlogOpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/" className="block rounded-xl">
              <div className="flex min-h-[120px] flex-col items-start justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5">
                <div className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sm font-semibold tracking-[0.08em] text-white">
                  Y
                </div>
                <div>
                  <div className="text-lg font-semibold tracking-tight text-white">YSEO</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    검색 운영 액션 허브
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <AppNavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="px-4 pb-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-400">
                OPS NOTE
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                정상 고객보다 지금 손대야 할 고객과 작업이 먼저 보이도록 유지합니다.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
              {navItems.map((item) => (
                <AppNavLink key={item.href} href={item.href} label={item.label} mobile />
              ))}
            </div>
          </div>

          <main className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-4 md:px-6 lg:px-8 lg:py-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
