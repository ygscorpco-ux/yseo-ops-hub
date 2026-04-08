"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AppNavLinkProps {
  href: string;
  label: string;
  caption: string;
}

export function AppNavLink({ href, label, caption }: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1 rounded-2xl border px-4 py-3 transition-colors",
        isActive
          ? "border-white/15 bg-white/12 text-white"
          : "border-white/8 bg-white/[0.03] text-white/72 hover:border-white/12 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-white/60">{caption}</span>
    </Link>
  );
}
