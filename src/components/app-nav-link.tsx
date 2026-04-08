"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AppNavLinkProps {
  href: string;
  label: string;
  caption?: string;
}

export function AppNavLink({ href, label, caption }: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1 rounded-lg px-3.5 py-3 transition-colors",
        isActive
          ? "bg-white text-slate-950"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      {caption ? (
        <span
          className={cn("text-xs", isActive ? "text-slate-500" : "text-slate-400")}
        >
          {caption}
        </span>
      ) : null}
    </Link>
  );
}
