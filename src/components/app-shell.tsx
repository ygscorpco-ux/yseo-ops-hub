import type { ReactNode } from "react";

import {
  ActivityIcon,
  FileTextIcon,
  LayoutGridIcon,
  ListTodoIcon,
} from "lucide-react";

import { AppNavLink } from "@/components/app-nav-link";
import { getDashboardView } from "@/lib/yseo/selectors";

const navItems = [
  {
    href: "/",
    label: "대시보드",
    caption: "오늘 처리할 고객과 이슈",
    icon: LayoutGridIcon,
  },
  {
    href: "/customers",
    label: "고객 리스트",
    caption: "100개 고객을 빠르게 스캔",
    icon: ActivityIcon,
  },
  {
    href: "/issues",
    label: "작업 큐",
    caption: "이슈와 승인 대기 처리",
    icon: ListTodoIcon,
  },
  {
    href: "/reports",
    label: "리포트",
    caption: "초안 검수와 내보내기 준비",
    icon: FileTextIcon,
  },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const dashboard = await getDashboardView();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 md:px-6 lg:px-8 lg:py-5">
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="hidden min-h-[calc(100vh-2.5rem)] rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100 lg:flex lg:flex-col">
            <div className="flex min-h-[120px] flex-col justify-center border-b border-white/10 px-2 pb-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                YSEO
              </span>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Search Ops Hub
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                정상 고객은 뒤로 보내고, 지금 처리할 고객과 작업만 앞으로 끌어옵니다.
              </p>
            </div>

            <nav className="mt-4 flex flex-col gap-2">
              {navItems.map(({ href, label, caption, icon: Icon }) => (
                <div key={href} className="flex items-start gap-2">
                  <div className="pt-3 pl-1 text-slate-500">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <AppNavLink href={href} label={label} caption={caption} />
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                운영 요약
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">처리 필요 고객</span>
                  <span className="font-medium text-white">{dashboard.metrics[0]?.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">긴급 이슈</span>
                  <span className="font-medium text-white">{dashboard.metrics[1]?.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">승인 대기 제안</span>
                  <span className="font-medium text-white">{dashboard.metrics[3]?.value}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
              {navItems.map(({ href, label }) => (
                <AppNavLink key={href} href={href} label={label} caption="" />
              ))}
            </div>
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
