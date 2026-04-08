import type { ReactNode } from "react";

import { ActivityIcon, FileTextIcon, LayoutGridIcon, ListTodoIcon } from "lucide-react";

import { AppNavLink } from "@/components/app-nav-link";
import { getDashboardView } from "@/lib/yseo/selectors";

const navItems = [
  {
    href: "/",
    label: "대시보드",
    caption: "오늘 손댈 고객과 위험 신호",
    icon: LayoutGridIcon,
  },
  {
    href: "/customers",
    label: "고객 리스트",
    caption: "100개 고객을 빠르게 훑는 운영 화면",
    icon: ActivityIcon,
  },
  {
    href: "/issues",
    label: "작업 큐",
    caption: "이슈, 제안, 승인 대기 중심",
    icon: ListTodoIcon,
  },
  {
    href: "/reports",
    label: "리포트",
    caption: "초안 생성과 검수 흐름",
    icon: FileTextIcon,
  },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const dashboard = await getDashboardView();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(23,92,72,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(159,109,55,0.14),transparent_28%),linear-gradient(180deg,#f5efe5_0%,#f9f7f1_100%)] text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[32px] bg-[linear-gradient(180deg,#1b3c35_0%,#102723_100%)] p-5 text-white shadow-[0_30px_80px_rgba(16,39,35,0.24)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-white/55">
                YSEO
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Search Ops Action Hub
                </h1>
                <p className="text-sm leading-6 text-white/68">
                  정상 고객을 길게 보여주지 않고, 지금 처리해야 할 고객과 작업만 앞으로 끌어옵니다.
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-3">
              {navItems.map(({ href, label, caption, icon: Icon }) => (
                <div key={href} className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <Icon className="size-4 text-white/45" />
                  </div>
                  <div className="pl-7">
                    <AppNavLink href={href} label={label} caption={caption} />
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.24em] text-white/45">
                  운영 스냅샷
                </span>
                <p className="text-sm text-white/72">
                  처리 필요 고객 {dashboard.metrics[0]?.value}개, 승인 대기 제안{" "}
                  {dashboard.metrics[3]?.value}건
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/55">긴급 이슈</span>
                  <span className="font-medium">{dashboard.metrics[1]?.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/55">연결 이상</span>
                  <span className="font-medium">{dashboard.metrics[2]?.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/55">리포트 초안</span>
                  <span className="font-medium">{dashboard.metrics[4]?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 rounded-[32px] border border-border/70 bg-background/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
