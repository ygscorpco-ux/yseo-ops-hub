"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppNavLink } from "@/components/app-nav-link";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/customers", label: "고객" },
];

export function BlogOpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/"
              className="flex min-h-[120px] items-center justify-center rounded-xl outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Image
                src="/branding/yeomgwangsa-logo.png"
                alt="YSEO 로고"
                width={103}
                height={76}
                priority
                className="h-auto w-[150px]"
              />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <AppNavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
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
