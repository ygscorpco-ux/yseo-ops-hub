"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AppNavLinkProps {
  href: string;
  label: string;
  mobile?: boolean;
}

export function AppNavLink({ href, label, mobile = false }: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        mobile
          ? "inline-flex items-center justify-center rounded-full px-4 py-2 text-center text-sm font-medium transition"
          : "flex items-center justify-center rounded-lg px-3 py-2.5 text-center text-sm font-medium transition",
        mobile
          ? isActive
            ? "bg-slate-950 text-white"
            : "border border-slate-200 bg-white text-slate-700"
          : isActive
            ? "bg-white text-slate-950"
            : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
